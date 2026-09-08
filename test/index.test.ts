import { afterEach, describe, expect, it, vi } from "vitest";
import { exportJWK, generateKeyPair, SignJWT } from "jose";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { createGateway, type Env, verifyWorkOsToken } from "../src/index.js";

const V4_SUCCESS_FIXTURE_SOURCE =
  "image/docs/contracts/fixtures/native-v4-evaluation-rubrics-success.json";
const V4_SUCCESS_FIXTURE_SHA256 =
  "076d5a9fe992dc346200ed175fa8a0c1ea526b0f45782934a8da7c7252e10a50";
const v4SuccessFixture = readFileSync(
  resolve(
    dirname(fileURLToPath(import.meta.url)),
    "fixtures/native-v4-evaluation-rubrics-success.json",
  ),
  "utf8",
);
const v4SuccessBody = v4SuccessFixture.trimEnd();

const principal = {
  subject: "user_01TEST",
  organizationId: "org_01TEST",
  scopes: new Set(["images:edit"]),
};

const v4Bindings = [
  ["GET", "/v4/capabilities", []],
  ["GET", "/v4/model-profiles", []],
  ["POST", "/v4/prompt-plans", ["batches:plan"]],
  ["POST", "/v4/generations", ["images:generate"]],
  ["POST", "/v4/captions", ["images:understand"]],
  ["POST", "/v4/image-edits", ["images:edit"]],
  ["POST", "/v4/inpaints", ["images:edit"]],
  ["POST", "/v4/segmentations", ["images:understand"]],
  ["POST", "/v4/enhancements", ["images:edit"]],
  ["POST", "/v4/image-operations", ["images:edit"]],
  ["POST", "/v4/image-operation-batches", ["images:edit"]],
  ["POST", "/v4/image-operation-plans", ["images:edit"]],
  ["POST", "/v4/portrait-mattings", ["images:edit"]],
  ["POST", "/v4/batch-plans", ["batches:plan"]],
  ["GET", "/v4/batch-plans/plan-1", ["batches:plan"]],
  ["GET", "/v4/evaluation-rubrics", ["campaigns:read"]],
  ["POST", "/v4/campaigns", ["batches:execute", "campaigns:write"]],
  ["GET", "/v4/campaigns", ["batches:execute", "campaigns:read", "jobs:cancel"]],
  ["GET", "/v4/campaigns/campaign-1", ["batches:execute", "campaigns:read", "jobs:cancel"]],
  ["POST", "/v4/campaigns/campaign-1/cancel", ["jobs:cancel"]],
  ["POST", "/v4/jobs", ["jobs:submit"]],
  ["GET", "/v4/jobs", ["jobs:read"]],
  ["GET", "/v4/jobs/job-1", ["jobs:read"]],
  ["GET", "/v4/jobs/job-1/previews", ["jobs:read"]],
  ["POST", "/v4/jobs/job-1/previews/step-1/output/access", ["jobs:read"]],
  ["POST", "/v4/jobs/job-1/cancel", ["jobs:cancel"]],
  ["POST", "/v4/artifacts/uploads", ["artifacts:write"]],
  ["POST", "/v4/artifacts/artifact-1/upload-completion", ["artifacts:write"]],
  ["GET", "/v4/artifacts", ["artifacts:read"]],
  ["GET", "/v4/artifacts/artifact-1", ["artifacts:read"]],
  ["POST", "/v4/artifacts/artifact-1/access", ["artifacts:access"]],
  ["DELETE", "/v4/artifacts/artifact-1", ["artifacts:delete"]],
  ["POST", "/v4/artifacts/search", ["artifacts:read"]],
] as const;

function env(success = true): Env {
  return {
    WORKOS_ISSUER: "https://example.authkit.app",
    WORKOS_AUDIENCE: "client_test",
    WORKOS_JWKS_URL: "https://example.authkit.app/oauth2/jwks",
    MODAL_UPSTREAM_URL: "https://private.example.modal.run",
    MODAL_PROXY_KEY: "gateway-key",
    MODAL_PROXY_SECRET: "gateway-secret",
    MAX_REQUEST_BYTES: "1024",
    RATE_LIMITER: { limit: vi.fn().mockResolvedValue({ success }) },
  };
}

afterEach(() => vi.unstubAllGlobals());

describe("OAuth gateway", () => {
  it("verifies a signed WorkOS-shaped token against remote JWKS", async () => {
    const { privateKey, publicKey } = await generateKeyPair("RS256");
    const jwk = await exportJWK(publicKey);
    const token = await new SignJWT({ org_id: "org_01TEST", scope: "images:edit" })
      .setProtectedHeader({ alg: "RS256", kid: "test-key" })
      .setIssuer("https://issuer.authkit.app")
      .setAudience("client_test")
      .setSubject("user_01TEST")
      .setIssuedAt()
      .setExpirationTime("5m")
      .sign(privateKey);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({ keys: [{ ...jwk, kid: "test-key", alg: "RS256", use: "sig" }] }),
      ),
    );
    const configured = env();
    configured.WORKOS_ISSUER = "https://issuer.authkit.app";
    configured.WORKOS_JWKS_URL = "https://issuer.authkit.app/oauth2/jwks-test";

    await expect(verifyWorkOsToken(token, configured)).resolves.toMatchObject({
      subject: "user_01TEST",
      organizationId: "org_01TEST",
      scopes: new Set(["images:edit"]),
    });
    configured.WORKOS_AUDIENCE = "wrong-audience";
    await expect(verifyWorkOsToken(token, configured)).rejects.toThrow();
  });

  it("rejects invalid bearer before rate limit or upstream", async () => {
    const verify = vi.fn().mockRejectedValue(new Error("invalid"));
    const upstream = vi.fn();
    vi.stubGlobal("fetch", upstream);
    const response = await createGateway(verify)(
      new Request("https://api-staging.image.mk10.org/v1/run", {
        headers: { Authorization: "Bearer legacy-key" },
      }),
      env(),
    );
    expect(response.status).toBe(401);
    expect(response.headers.get("WWW-Authenticate")).toBe('Bearer error="invalid_token"');
    expect(upstream).not.toHaveBeenCalled();
  });

  it("enforces route scope before upstream", async () => {
    const upstream = vi.fn();
    vi.stubGlobal("fetch", upstream);
    const response = await createGateway(vi.fn().mockResolvedValue({ ...principal, scopes: new Set() }))(
      new Request("https://api-staging.image.mk10.org/v1/run", {
        method: "POST",
        headers: { Authorization: "Bearer signed.jwt" },
      }),
      env(),
    );
    expect(response.status).toBe(403);
    expect(response.headers.get("WWW-Authenticate")).toBe(
      'Bearer error="insufficient_scope", scope="images:edit"',
    );
    expect(upstream).not.toHaveBeenCalled();
  });

  it.each([
    ["POST", "/v1/images/generations", "images:generate"],
    ["POST", "/v1/generations", "images:generate"],
    ["POST", "/v2beta/stable-image/generate/core", "images:generate"],
    ["POST", "/v1/images/edits", "images:edit"],
    ["POST", "/v1/image-to-image", "images:edit"],
    ["POST", "/v1/enhancements", "images:edit"],
    ["POST", "/v1/image-operations", "images:edit"],
    ["POST", "/v1/image-operation-batches", "images:edit"],
    ["POST", "/v1/compositions", "images:edit"],
    ["POST", "/v1/run", "images:edit"],
    ["POST", "/v2beta/stable-image/edit/inpaint", "images:edit"],
    ["POST", "/v2beta/stable-image/upscale/fast", "images:edit"],
    ["POST", "/v1/responses", "images:understand"],
    ["POST", "/v1/embeddings", "images:understand"],
    ["POST", "/v1/segmentations", "images:understand"],
    ["POST", "/v1/chat/completions", "batches:plan"],
    ["POST", "/v1/prompt-plans", "batches:plan"],
    ["POST", "/v1/predictions", "batches:execute"],
    ["GET", "/v1/predictions/prediction-1", "batches:execute"],
    ["POST", "/v1/models/owner/name/predictions", "batches:execute"],
    ["POST", "/v1/uploads", "batches:execute"],
    ["POST", "/v1/uploads/artifact-1/complete", "batches:execute"],
    ["POST", "/v1/jobs", "batches:execute"],
    ["POST", "/v1/predictions/prediction-1/cancel", "jobs:cancel"],
    ["POST", "/v1/jobs/job-1/cancel", "jobs:cancel"],
    ["GET", "/v1/jobs", "campaigns:read"],
    ["GET", "/v1/jobs/job-1", "campaigns:read"],
    ["GET", "/v1/jobs/job-1/previews", "campaigns:read"],
    ["GET", "/v1/artifacts", "artifacts:read"],
    ["GET", "/v1/artifacts/artifact-1", "artifacts:read"],
    ["POST", "/v1/search", "artifacts:read"],
  ] as const)("enforces %s %s with %s", async (method, path, scope) => {
    const upstream = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", upstream);
    const gateway = createGateway(
      vi.fn().mockResolvedValue({ ...principal, scopes: new Set([scope]) }),
    );
    const allowed = await gateway(
      new Request(`https://api-staging.image.mk10.org${path}`, {
        method,
        headers: { Authorization: "Bearer signed.jwt" },
      }),
      env(),
    );
    expect(allowed.status).toBe(204);
    expect(upstream).toHaveBeenCalledOnce();

    upstream.mockClear();
    const denied = await createGateway(
      vi.fn().mockResolvedValue({ ...principal, scopes: new Set(["unrelated:scope"]) }),
    )(
      new Request(`https://api-staging.image.mk10.org${path}`, {
        method,
        headers: { Authorization: "Bearer signed.jwt" },
      }),
      env(),
    );
    expect(denied.status).toBe(403);
    expect(denied.headers.get("WWW-Authenticate")).toBe(
      `Bearer error="insufficient_scope", scope="${scope}"`,
    );
    expect(upstream).not.toHaveBeenCalled();
  });

  it.each(v4Bindings)("enforces the V4 scope tuple for %s %s", async (method, path, scopes) => {
    const upstream = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", upstream);
    const allowed = await createGateway(
      vi.fn().mockResolvedValue({ ...principal, scopes: new Set(scopes) }),
    )(
      new Request(`https://api-staging.image.mk10.org${path}`, {
        method,
        headers: { Authorization: "Bearer signed.jwt" },
      }),
      env(),
    );
    expect(allowed.status).toBe(204);
    expect(upstream).toHaveBeenCalledOnce();

    if (scopes.length === 0) return;

    for (const omittedScope of scopes) {
      upstream.mockClear();
      const denied = await createGateway(
        vi.fn().mockResolvedValue({
          ...principal,
          scopes: new Set(scopes.filter((scope) => scope !== omittedScope)),
        }),
      )(
        new Request(`https://api-staging.image.mk10.org${path}`, {
          method,
          headers: { Authorization: "Bearer signed.jwt" },
        }),
        env(),
      );
      expect(denied.status).toBe(403);
      expect(denied.headers.get("WWW-Authenticate")).toBe(
        `Bearer error="insufficient_scope", scope="${scopes.join(" ")}"`,
      );
      expect(upstream).not.toHaveBeenCalled();
    }
  });

  it.each([
    ["PATCH", "/v4/capabilities"],
    ["GET", "/v4/not-a-route"],
    ["GET", "/v4/jobs/job-1/extra"],
  ] as const)("leaves V4 application routing ownership to upstream for %s %s", async (method, path) => {
    const upstream = vi.fn().mockResolvedValue(new Response(null, { status: 404 }));
    vi.stubGlobal("fetch", upstream);
    const response = await createGateway(
      vi.fn().mockResolvedValue({ ...principal, scopes: new Set() }),
    )(
      new Request(`https://api-staging.image.mk10.org${path}`, {
        method,
        headers: { Authorization: "Bearer signed.jwt" },
      }),
      env(),
    );
    expect(response.status).toBe(404);
    expect(upstream).toHaveBeenCalledOnce();
  });

  it("rejects declared oversize and rate limits without upstream", async () => {
    const upstream = vi.fn();
    vi.stubGlobal("fetch", upstream);
    const gateway = createGateway(vi.fn().mockResolvedValue(principal));
    const oversized = await gateway(
      new Request("https://api-staging.image.mk10.org/v1/run", {
        method: "POST",
        headers: { Authorization: "Bearer signed.jwt", "Content-Length": "1025" },
      }),
      env(),
    );
    const limited = await gateway(
      new Request("https://api-staging.image.mk10.org/v1/run", {
        method: "POST",
        headers: { Authorization: "Bearer signed.jwt" },
      }),
      env(false),
    );
    expect(oversized.status).toBe(413);
    expect(limited.status).toBe(429);
    expect(upstream).not.toHaveBeenCalled();
  });

  it("preserves bearer and payload while replacing private headers", async () => {
    const upstream = vi.fn().mockImplementation(async (request: Request) => {
      expect(request.url).toBe("https://private.example.modal.run/v1/run?mode=test");
      expect(request.headers.get("Authorization")).toBe("Bearer signed.jwt");
      expect(request.headers.get("Modal-Key")).toBe("gateway-key");
      expect(request.headers.get("Modal-Secret")).toBe("gateway-secret");
      expect(request.headers.get("X-Principal-ID")).toBeNull();
      expect(request.headers.get("X-Tenant-ID")).toBeNull();
      expect(request.headers.get("X-Forwarded-For")).toBeNull();
      expect(request.headers.get("X-Request-ID")).not.toBe("attacker-id");
      expect(await request.text()).toBe('{"ok":true}');
      return new Response("upstream", {
        status: 201,
        headers: { "X-Modal-Internal": "private", Server: "modal", "X-Safe": "yes" },
      });
    });
    vi.stubGlobal("fetch", upstream);
    const response = await createGateway(vi.fn().mockResolvedValue(principal))(
      new Request("https://api-staging.image.mk10.org/v1/run?mode=test", {
        method: "POST",
        headers: {
          Authorization: "Bearer signed.jwt",
          "Content-Type": "application/json",
          "Modal-Key": "attacker-key",
          "Modal-Secret": "attacker-secret",
          "X-Principal-ID": "attacker-principal",
          "X-Tenant-ID": "attacker-tenant",
          "X-Forwarded-For": "127.0.0.1",
          "X-Request-ID": "attacker-id",
        },
        body: '{"ok":true}',
      }),
      env(),
    );
    expect(response.status).toBe(201);
    expect(response.headers.get("X-Modal-Internal")).toBeNull();
    expect(response.headers.get("Server")).toBeNull();
    expect(response.headers.get("X-Safe")).toBe("yes");
    expect(response.headers.get("X-Request-ID")).not.toBe("attacker-id");
  });

  it("passes the producer-bound V4 response identity and bytes through unchanged", async () => {
    expect(createHash("sha256").update(v4SuccessFixture).digest("hex")).toBe(
      V4_SUCCESS_FIXTURE_SHA256,
    );
    expect(V4_SUCCESS_FIXTURE_SOURCE).toContain("native-v4-evaluation-rubrics-success.json");

    const upstream = vi.fn().mockImplementation(async (request: Request) => {
      expect(request.headers.get("X-Request-ID")).toBeNull();
      return new Response(v4SuccessBody, {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "X-Modal-Internal": "private",
          "X-Request-ID": "req_0123456789abcdef0123456789abcdef",
          "X-Safe": "yes",
        },
      });
    });
    vi.stubGlobal("fetch", upstream);

    const response = await createGateway(
      vi.fn().mockResolvedValue({
        ...principal,
        scopes: new Set(["campaigns:read"]),
      }),
    )(
      new Request("https://api-staging.image.mk10.org/v4/evaluation-rubrics", {
        headers: {
          Authorization: "Bearer signed.jwt",
          "X-Request-ID": "attacker-id",
        },
      }),
      env(),
    );

    const responseBody = await response.text();
    expect(responseBody).toBe(v4SuccessBody);
    expect(response.headers.get("X-Request-ID")).toBe(
      "req_0123456789abcdef0123456789abcdef",
    );
    expect(JSON.parse(responseBody).meta.request_id).toBe(response.headers.get("X-Request-ID"));
    expect(response.headers.get("X-Modal-Internal")).toBeNull();
    expect(response.headers.get("X-Safe")).toBe("yes");
  });

  it("fails closed on partial configuration", async () => {
    const broken = env();
    broken.MODAL_PROXY_SECRET = "";
    const upstream = vi.fn();
    vi.stubGlobal("fetch", upstream);
    const response = await createGateway(vi.fn().mockResolvedValue(principal))(
      new Request("https://api-staging.image.mk10.org/v1/run", {
        headers: { Authorization: "Bearer signed.jwt" },
      }),
      broken,
    );
    expect(response.status).toBe(503);
    expect(upstream).not.toHaveBeenCalled();
  });
});

import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";

export interface RateLimiter {
  limit(input: { key: string }): Promise<{ success: boolean }>;
}

export interface Env {
  WORKOS_ISSUER: string;
  WORKOS_AUDIENCE: string;
  WORKOS_JWKS_URL: string;
  MODAL_UPSTREAM_URL: string;
  MODAL_PROXY_KEY: string;
  MODAL_PROXY_SECRET: string;
  MAX_REQUEST_BYTES: string;
  RATE_LIMITER: RateLimiter;
}

interface VerifiedPrincipal {
  subject: string;
  organizationId: string;
  scopes: ReadonlySet<string>;
}

type VerifyToken = (token: string, env: Env) => Promise<VerifiedPrincipal>;

const PRIVATE_REQUEST_HEADERS = [
  "cf-connecting-ip",
  "host",
  "modal-key",
  "modal-secret",
  "x-forwarded-for",
  "x-forwarded-host",
  "x-forwarded-proto",
  "x-principal-id",
  "x-request-id",
  "x-tenant-id",
] as const;

const PRIVATE_RESPONSE_HEADERS = [
  "modal-key",
  "modal-secret",
  "server",
  "x-modal-*",
] as const;

const jwksByUrl = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

function remoteJwks(url: string): ReturnType<typeof createRemoteJWKSet> {
  const existing = jwksByUrl.get(url);
  if (existing !== undefined) return existing;
  const created = createRemoteJWKSet(new URL(url), {
    cooldownDuration: 30_000,
    cacheMaxAge: 300_000,
    timeoutDuration: 5_000,
  });
  jwksByUrl.set(url, created);
  return created;
}

function requiredString(payload: JWTPayload, name: string): string {
  const value = payload[name];
  if (typeof value !== "string" || value.trim() === "") throw new Error("invalid token");
  return value;
}

export const verifyWorkOsToken: VerifyToken = async (token, env) => {
  const { payload } = await jwtVerify(token, remoteJwks(env.WORKOS_JWKS_URL), {
    issuer: env.WORKOS_ISSUER,
    audience: env.WORKOS_AUDIENCE,
    algorithms: ["RS256"],
    clockTolerance: 30,
    requiredClaims: ["iat", "exp", "sub", "org_id", "scope"],
  });
  const subject = requiredString(payload, "sub");
  const organizationId = requiredString(payload, "org_id");
  const rawScope = requiredString(payload, "scope");
  const scopes = new Set(rawScope.split(/\s+/u).filter(Boolean));
  if (scopes.size === 0) throw new Error("invalid token");
  return { subject, organizationId, scopes };
};

function requiredScope(url: URL, method: string): string | undefined {
  const path = url.pathname;
  if (
    path === "/v1/images/generations" ||
    path === "/v1/generations" ||
    path.startsWith("/v2beta/stable-image/generate/")
  ) {
    return "images:generate";
  }
  if (
    [
      "/v1/images/edits",
      "/v1/image-to-image",
      "/v1/enhancements",
      "/v1/image-operations",
      "/v1/image-operation-batches",
      "/v1/compositions",
      "/v1/run",
    ].includes(path) ||
    path.startsWith("/v2beta/stable-image/edit/") ||
    path.startsWith("/v2beta/stable-image/upscale/")
  ) {
    return "images:edit";
  }
  if (["/v1/responses", "/v1/embeddings", "/v1/segmentations"].includes(path)) {
    return "images:understand";
  }
  if (path === "/v1/chat/completions" || path === "/v1/prompt-plans") return "batches:plan";
  if (
    path.startsWith("/v1/predictions") ||
    (path.startsWith("/v1/models/") && path.endsWith("/predictions"))
  ) {
    return path.endsWith("/cancel") ? "jobs:cancel" : "batches:execute";
  }
  if (path === "/v1/jobs") {
    return method === "GET" ? "campaigns:read" : "batches:execute";
  }
  if (path.startsWith("/v1/uploads")) return "batches:execute";
  if (path.startsWith("/v1/jobs/")) {
    return method === "POST" && path.endsWith("/cancel") ? "jobs:cancel" : "campaigns:read";
  }
  if (path === "/v1/artifacts" || path.startsWith("/v1/artifacts/") || path === "/v1/search") {
    return "artifacts:read";
  }
  return undefined;
}

function bearerValue(request: Request): { authorization: string; token: string } | undefined {
  const authorization = request.headers.get("authorization");
  if (authorization === null) return undefined;
  const match = /^Bearer ([^\s]+)$/u.exec(authorization);
  return match?.[1] === undefined ? undefined : { authorization, token: match[1] };
}

function oauthError(status: number, error: string, requestId: string, scope?: string): Response {
  const challenge = [`Bearer error="${error}"`, ...(scope === undefined ? [] : [`scope="${scope}"`])].join(", ");
  return new Response(JSON.stringify({ error }), {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/json",
      "WWW-Authenticate": challenge,
      "X-Request-ID": requestId,
    },
  });
}

async function rateKey(principal: VerifiedPrincipal): Promise<string> {
  const bytes = new TextEncoder().encode(`${principal.organizationId}\0${principal.subject}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, "0")).join("");
}

function validConfiguration(env: Env): boolean {
  try {
    const issuer = new URL(env.WORKOS_ISSUER);
    const jwks = new URL(env.WORKOS_JWKS_URL);
    const upstream = new URL(env.MODAL_UPSTREAM_URL);
    return (
      issuer.protocol === "https:" &&
      jwks.protocol === "https:" &&
      upstream.protocol === "https:" &&
      env.WORKOS_AUDIENCE.trim() !== "" &&
      env.MODAL_PROXY_KEY !== "" &&
      env.MODAL_PROXY_SECRET !== "" &&
      Number.isSafeInteger(Number(env.MAX_REQUEST_BYTES)) &&
      Number(env.MAX_REQUEST_BYTES) > 0
    );
  } catch {
    return false;
  }
}

export function createGateway(verifyToken: VerifyToken = verifyWorkOsToken) {
  return async function fetchGateway(request: Request, env: Env): Promise<Response> {
    const requestId = crypto.randomUUID();
    if (!validConfiguration(env)) return new Response("service unavailable", { status: 503 });

    const declaredLength = request.headers.get("content-length");
    if (declaredLength !== null && Number(declaredLength) > Number(env.MAX_REQUEST_BYTES)) {
      return new Response("request too large", { status: 413, headers: { "X-Request-ID": requestId } });
    }
    const body =
      request.method === "GET" || request.method === "HEAD"
        ? undefined
        : await request.arrayBuffer();
    if (body !== undefined && body.byteLength > Number(env.MAX_REQUEST_BYTES)) {
      return new Response("request too large", {
        status: 413,
        headers: { "X-Request-ID": requestId },
      });
    }

    const bearer = bearerValue(request);
    if (bearer === undefined) return oauthError(401, "invalid_token", requestId);

    let principal: VerifiedPrincipal;
    try {
      principal = await verifyToken(bearer.token, env);
    } catch {
      return oauthError(401, "invalid_token", requestId);
    }

    const scope = requiredScope(new URL(request.url), request.method);
    if (scope !== undefined && !principal.scopes.has(scope)) {
      return oauthError(403, "insufficient_scope", requestId, scope);
    }
    if (!(await env.RATE_LIMITER.limit({ key: await rateKey(principal) })).success) {
      return new Response("rate limited", {
        status: 429,
        headers: { "Cache-Control": "no-store", "Retry-After": "1", "X-Request-ID": requestId },
      });
    }

    const publicUrl = new URL(request.url);
    const upstreamUrl = new URL(env.MODAL_UPSTREAM_URL);
    upstreamUrl.pathname = publicUrl.pathname;
    upstreamUrl.search = publicUrl.search;
    const headers = new Headers(request.headers);
    for (const name of PRIVATE_REQUEST_HEADERS) headers.delete(name);
    headers.set("Authorization", bearer.authorization);
    headers.set("Modal-Key", env.MODAL_PROXY_KEY);
    headers.set("Modal-Secret", env.MODAL_PROXY_SECRET);
    headers.set("X-Request-ID", requestId);

    const upstream = await fetch(
      new Request(upstreamUrl, {
        method: request.method,
        headers,
        ...(body === undefined ? {} : { body }),
        redirect: "manual",
      }),
    );
    const responseHeaders = new Headers(upstream.headers);
    for (const name of PRIVATE_RESPONSE_HEADERS) {
      if (name.endsWith("*")) {
        const prefix = name.slice(0, -1);
        const matching: string[] = [];
        responseHeaders.forEach((_value, headerName) => {
          if (headerName.startsWith(prefix)) matching.push(headerName);
        });
        for (const headerName of matching) responseHeaders.delete(headerName);
      } else {
        responseHeaders.delete(name);
      }
    }
    responseHeaders.set("X-Request-ID", requestId);
    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    });
  };
}

export default { fetch: createGateway() } satisfies ExportedHandler<Env>;

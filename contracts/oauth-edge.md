# Image-platform OAuth edge contract

The normative source is `image/docs/contracts/oauth-edge.md` at the accepted image-platform
revision. This repository implements the Cloudflare Worker projection of that provider-neutral
contract for `api-staging.image.mk10.org`.

- Validate the WorkOS JWT before making an upstream request.
- Require exact issuer, audience, RS256 signature, expiry, organization, and space-separated scope.
- Require the route scope and apply rate policy to an opaque organization/subject digest.
- Preserve the caller's Authorization value exactly.
- Remove caller-controlled Modal, forwarding, host, request identity, and identity projection
  headers. Inject only gateway-owned Modal credentials. Preserve the existing gateway-owned request
  identity for V1 and provider-compatible requests. For V4, do not override the application-owned
  request identity on an upstream response.
- Reject invalid auth, insufficient scope, oversized requests, and rate limits without invoking
  Modal.
- Do not expose or log WorkOS tokens, claims, Modal credentials, or private upstream URLs.

For a V4 application response, the V4 application owns the `req_` identifier and returns the same
value in `meta.request_id` and `X-Request-ID`. The edge passes both body and header through unchanged.
An edge rejection or failure before an application response exists uses an edge-owned request ID and
does not claim to be a V4 application envelope. Existing V1 and provider-compatible response identity
behavior remains unchanged.

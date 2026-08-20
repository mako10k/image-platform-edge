# Image-platform OAuth edge contract

The normative source is `image/docs/contracts/oauth-edge.md` at the accepted image-platform
revision. This repository implements the Cloudflare Worker projection of that provider-neutral
contract for `api-staging.image.mk10.org`.

- Validate the WorkOS JWT before making an upstream request.
- Require exact issuer, audience, RS256 signature, expiry, organization, and space-separated scope.
- Require the route scope and apply rate policy to an opaque organization/subject digest.
- Preserve the caller's Authorization value exactly.
- Remove caller-controlled Modal, forwarding, host, request identity, and identity projection
  headers; inject only gateway-owned Modal credentials and request identity.
- Reject invalid auth, insufficient scope, oversized requests, and rate limits without invoking
  Modal.
- Do not expose or log WorkOS tokens, claims, Modal credentials, or private upstream URLs.

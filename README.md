# image-platform-edge

Cloudflare Worker implementation of the private image-platform OAuth edge contract.

This repository is local-only until publication is separately authorized. The configured staging
hostname is `api-staging.image.mk10.org`; no Worker, DNS record, WorkOS object, Modal credential,
or deployment is created by local checks.

```sh
npm ci
npm run check
```

Deployment requires separately approved exact Cloudflare, WorkOS, Modal, DNS, secret, request,
cost, cleanup, and readback targets.

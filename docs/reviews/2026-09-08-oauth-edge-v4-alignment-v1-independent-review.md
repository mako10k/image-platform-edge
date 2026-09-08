# OAuth edge V4 alignment revision 1 independent review

- Date: 2026-09-08
- Lifecycle step: 3
- Status: `COMPLETED`
- Owner route: `REVIEW`
- Candidate: `docs/requirements/oauth-edge-v4-alignment.v1.md`
- Verified candidate SHA-256: `a2d0c71f1b9f81d672e31df2aa918676d85eadc28565c39a530ff069c227493f`
- Candidate changed by reviewer: no

## Results

### 1. Exact 33-binding equality

Classification: no contradiction.

Mechanical comparison found exactly 33 unique method/path/ordered-scope tuples with no addition,
omission, method/path difference, or scope-order difference against accepted V4 design revision 7.
They also match the deployed binding test at image-platform commit `7ba3867`.

### 2. V4 404/405 ownership and bearer validation

Classification: no contradiction.

Accepted V4 design owns `route_not_found`/404 and `method_not_allowed`/405. The existing edge contract
requires WorkOS bearer validation before any Modal invocation. The candidate composes these rules:
unauthenticated requests stop at the edge; authenticated unknown paths and unsupported methods reach
the V4 application without an edge scope decision.

### 3. V1 compatibility and credential/header boundary

Classification: no contradiction.

The candidate preserves the existing V1/provider-compatible classifications, scopes, rate and size
controls, forwarding, and responses. Its bearer preservation, caller-header removal, gateway-only
Modal credentials, request identity, and response secrecy agree with `contracts/oauth-edge.md` and
edge commit `08c9cef`.

### 4. Multi-scope conjunction and denial challenge

Classification: no contradiction.

Every scope-tuple member is mandatory, denial precedes upstream invocation, and the challenge carries
the complete ordered tuple. This matches accepted design revision 7.

### 5. Scope-expansion check

No unauthorized concern became a requirement blocker.

- Evidence gap or unresolved unknown: WorkOS provisioning, deployed edge configuration, and live
  public-host behavior remain unverified rollout facts and are correctly separated from local
  acceptance.
- Out of scope: CLI implementation, V5 behavior, Cloudflare/DNS/secret mutations, publication, and
  release.
- Optional or future candidate: generated runtime manifests, shared cross-repository packages, new
  registry services, and V5 capabilities remain unrequired.
- Local compilation, lint, tests, regression, and Wrangler dry-run are verification evidence rather
  than additional product behavior or deployment authority.

## Reviewer conclusion

The unchanged snapshot can proceed to lifecycle step 4. No contradiction was found in the five
owner-reviewed questions. `ACCEPT` is supportable if independently chosen by the owner. This review
does not accept the requirement or authorize implementation, deployment, publication, secrets, or
live requests.

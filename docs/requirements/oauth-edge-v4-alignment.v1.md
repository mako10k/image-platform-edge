# OAuth edge V4 alignment requirements, document revision 1

- Status: `DRAFT_FOR_FIRST_OWNER_REVIEW`
- Date: 2026-09-08
- Requirement document revision: `1`
- External API namespace: `/v4`
- Lifecycle phase: step 1 authoring
- Decision authority: user

## 1. Provenance and authority

This candidate defines only the public OAuth transport needed to reach the already accepted and
deployed Native API V4. It does not change Native API V4 semantics or the existing V1/provider-
compatible edge contract.

| Role | Source | SHA-256 or revision |
| --- | --- | --- |
| Existing edge contract | `contracts/oauth-edge.md` in edge commit `08c9cef8c497c836690d667a3b18985c2627bdd9` | existing authority, preserved |
| Accepted V4 requirement | image-platform `docs/requirements/native-api-v4-interface-alignment.r3.md` | `e825d34ad807b4236dbd91b84fa09e9fac6086ff7617935dff197988becd5873` |
| V4 requirement acceptance | image-platform `docs/reviews/2026-09-04-native-api-v4-requirements-r3-second-owner-review-result.md` | accepts the preceding digest |
| Accepted V4 design | image-platform `docs/design/native-api-v4-interface-alignment.r7.md` | `6bd786b13f27d79e6c50cbd4d2b14bf92d2bb2378b43b9f8c9cdfe6427523252` |
| Deployed V4 binding test | image-platform `tests/contract/test_native_api_v4_routes.py` at deployed commit `7ba386742f2668328483bd404ab17da356ae1c0f` | `3e0b7a224bed3d2ead1ce38cbf8c0fc3b4a63393619f65fc36766582167a87ed` |

The 33 V4 method/path/scope tuples below are adopted from the accepted V4 design and deployed
binding test. Those sources remain authoritative for application behavior. This edge requirement
owns only authentication, authorization before forwarding, protected-header transformation, and
transport to the private Modal upstream.

## 2. Required outcome

An OAuth client that possesses a valid WorkOS bearer token and every scope required by a selected
V4 binding can call that binding through the existing public edge. The edge forwards the request to
the configured private Modal V4 application without requiring the client to know or possess Modal
proxy credentials.

## 3. Preserved behavior

1. Existing V1 and provider-compatible paths retain their current method/path classification,
   required scopes, authentication, rate limiting, request-size limit, forwarding, and response
   behavior.
2. The caller's valid `Authorization` value, query string, method, and request body are forwarded
   unchanged by this alignment.
3. Caller-controlled Modal, forwarding, host, request-identity, and identity-projection headers are
   removed. Only gateway-owned Modal credentials and request identity are injected upstream.
4. Private Modal credentials, private upstream URLs, WorkOS tokens, and decoded personal claims are
   neither returned nor logged.
5. The edge does not translate V4 request or response bodies and does not implement a producer,
   pipeline, persistence lifecycle, CLI command, or V4 error envelope.

## 4. V4 route and scope classification

The edge matches an allowed V4 binding by exact HTTP method and path template. Every member of the
ordered scope tuple is required; an empty tuple means that a valid bearer token is still required but
no additional scope is required by that binding.

| Method | Path template | Required ordered scope tuple |
| --- | --- | --- |
| GET | `/v4/capabilities` | `()` |
| GET | `/v4/model-profiles` | `()` |
| POST | `/v4/prompt-plans` | `(batches:plan)` |
| POST | `/v4/generations` | `(images:generate)` |
| POST | `/v4/captions` | `(images:understand)` |
| POST | `/v4/image-edits` | `(images:edit)` |
| POST | `/v4/inpaints` | `(images:edit)` |
| POST | `/v4/segmentations` | `(images:understand)` |
| POST | `/v4/enhancements` | `(images:edit)` |
| POST | `/v4/image-operations` | `(images:edit)` |
| POST | `/v4/image-operation-batches` | `(images:edit)` |
| POST | `/v4/image-operation-plans` | `(images:edit)` |
| POST | `/v4/portrait-mattings` | `(images:edit)` |
| POST | `/v4/batch-plans` | `(batches:plan)` |
| GET | `/v4/batch-plans/{plan_id}` | `(batches:plan)` |
| GET | `/v4/evaluation-rubrics` | `(campaigns:read)` |
| POST | `/v4/campaigns` | `(batches:execute, campaigns:write)` |
| GET | `/v4/campaigns` | `(batches:execute, campaigns:read, jobs:cancel)` |
| GET | `/v4/campaigns/{campaign_id}` | `(batches:execute, campaigns:read, jobs:cancel)` |
| POST | `/v4/campaigns/{campaign_id}/cancel` | `(jobs:cancel)` |
| POST | `/v4/jobs` | `(jobs:submit)` |
| GET | `/v4/jobs` | `(jobs:read)` |
| GET | `/v4/jobs/{job_id}` | `(jobs:read)` |
| GET | `/v4/jobs/{job_id}/previews` | `(jobs:read)` |
| POST | `/v4/jobs/{job_id}/previews/{step_id}/{output}/access` | `(jobs:read)` |
| POST | `/v4/jobs/{job_id}/cancel` | `(jobs:cancel)` |
| POST | `/v4/artifacts/uploads` | `(artifacts:write)` |
| POST | `/v4/artifacts/{artifact_id}/upload-completion` | `(artifacts:write)` |
| GET | `/v4/artifacts` | `(artifacts:read)` |
| GET | `/v4/artifacts/{artifact_id}` | `(artifacts:read)` |
| POST | `/v4/artifacts/{artifact_id}/access` | `(artifacts:access)` |
| DELETE | `/v4/artifacts/{artifact_id}` | `(artifacts:delete)` |
| POST | `/v4/artifacts/search` | `(artifacts:read)` |

Path parameters match exactly one non-empty segment. Static bindings take precedence over parameter
bindings, so `/v4/artifacts/uploads` is not classified as artifact detail.

For a matched binding, absence of any required scope returns `403 insufficient_scope` with the
complete ordered tuple in `WWW-Authenticate`, and the edge must not invoke the upstream application.

After bearer validation, an unknown `/v4` path or an unsupported method is forwarded without a
route-scope decision so the V4 application remains the authority for its `404 route_not_found` or
`405 method_not_allowed` envelope. This does not permit unauthenticated forwarding.

## 5. Acceptance criteria

The alignment is locally accepted only when automated tests establish all of the following:

1. all 33 exact method/path bindings classify to the ordered tuples above;
2. every binding permits a principal with the full tuple and denies a principal missing each member
   in turn without invoking upstream;
3. both empty-scope discovery bindings still require valid bearer authentication;
4. parameter bindings reject extra, missing, or empty path segments, and static/parameter precedence
   is unambiguous;
5. unknown V4 paths and unsupported methods reach the upstream only after valid bearer
   authentication and preserve the upstream 404/405 response;
6. the existing V1/provider-compatible scope matrix and all existing edge tests remain unchanged and
   passing;
7. method, path, query, body, Authorization, request identity, private-header removal, Modal credential
   injection, and safe response-header behavior are covered by tests; and
8. TypeScript compilation, formatting/lint checks, unit tests, and the existing Wrangler dry-run pass.

The delivery milestone additionally requires a separately authorized deployment and an authenticated
public-edge smoke that checks at least `GET /v4/capabilities` and `POST /v4/image-operations`, including
the expected response API version and deterministic output identity. Local acceptance alone does not
claim that milestone.

## 6. Explicit exclusions and later effects

This requirement does not add or change:

- Native API V4 application schemas, producers, errors, persistence, or deployment composition;
- V1 or provider-compatible route semantics;
- CLI command names or command-surface redesign;
- WorkOS scope definitions, role assignments, grants, clients, or tokens;
- Cloudflare, DNS, Modal, secret-store, GitHub, release, or production state;
- a generated runtime manifest, shared cross-repository code package, or new registry service; or
- V5-candidate capability.

WorkOS provisioning, edge deployment, live requests, publication, and CLI implementation retain
their own authority and verification gates.

## 7. First owner-review decisions

The first owner review decides whether:

1. the requirement is correctly limited to making the accepted V4 transport reachable through the
   existing OAuth edge;
2. the exact 33 binding tuples and conjunction behavior are the correct authorization boundary;
3. forwarding unknown V4 paths and unsupported methods after bearer validation correctly preserves
   the V4 application's 404/405 authority; and
4. the exclusions prevent this recovery task from becoming a broader edge, CLI, identity-provider,
   or V5 redesign.

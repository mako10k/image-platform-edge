# OAuth edge V4 alignment revision 1 second owner review

- Date: 2026-09-08
- Lifecycle step: 4
- Status: `AWAITING_OWNER_DECISION`
- Step-2 route: `REVIEW`
- Requirement candidate changed since step 2: no
- Independent-review status: `COMPLETED`

## Exact decision subjects

| Role | Path | SHA-256 |
| --- | --- | --- |
| Requirement candidate | `docs/requirements/oauth-edge-v4-alignment.v1.md` | `a2d0c71f1b9f81d672e31df2aa918676d85eadc28565c39a530ff069c227493f` |
| Author self-review | `docs/reviews/2026-09-08-oauth-edge-v4-alignment-v1-self-review.md` | `5e72412babe2987d66f16725f938ba9cfc7d82efa563b79fb0df8fa6bc39eed6` |
| First owner-review packet | `docs/reviews/2026-09-08-oauth-edge-v4-alignment-v1-first-owner-review.md` | `fc0361f2f2ca40f76eb2dadd93a7ec3b0c3b35c0d6ea5672ae18a5fde27a644f` |
| First owner-review result | `docs/reviews/2026-09-08-oauth-edge-v4-alignment-v1-first-owner-review-result.md` | `17820e75c2ad99993c3c789dd464a1103e41503f9b6041944ceac695b13033b5` |
| Independent review | `docs/reviews/2026-09-08-oauth-edge-v4-alignment-v1-independent-review.md` | `9ac41bb9b7fa47e1f0afc99780a447f50297014ccde8f254c11d2b87fede3d37` |

## Independent-review result

The reviewer completed all five questions and found no contradiction:

1. all 33 method/path/ordered-scope tuples match accepted V4 design revision 7 and the deployed
   binding test exactly;
2. unknown V4 paths and unsupported methods remain bearer-authenticated and are forwarded to the V4
   application for its 404/405 contract response;
3. V1/provider-compatible routing and the existing Modal credential/header boundary are preserved;
4. two- and three-scope tuples require every member and denial names the complete ordered tuple; and
5. rollout, CLI, V5, and implementation-control concerns remain outside the requirement boundary.

The recorded deployment configuration, complete WorkOS scope provisioning, and live public-host
behavior remain unresolved rollout evidence. They do not contradict this requirement and do not
become additional acceptance criteria.

## Owner decision

Choose exactly one:

- `REVISE`: return to step 1 for any requirement-text change;
- `REREVIEW`: keep the requirement digest unchanged, add or change a review question, and return to
  step 3; or
- `ACCEPT`: accept only the exact requirement snapshot above.

The supported recommendation is `ACCEPT`. Acceptance fixes the bounded edge requirement only; it
does not authorize implementation, commit, push, deployment, WorkOS/Cloudflare/secret mutation, or
live requests.

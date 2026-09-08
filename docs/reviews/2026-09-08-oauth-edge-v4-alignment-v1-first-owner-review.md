# OAuth edge V4 alignment revision 1 first owner review

- Date: 2026-09-08
- Lifecycle step: 2
- Status: `AWAITING_OWNER_ROUTE`
- Requirement text changed after self-review: no

## Exact review subjects

| Role | Path | SHA-256 |
| --- | --- | --- |
| Requirement candidate | `docs/requirements/oauth-edge-v4-alignment.v1.md` | `a2d0c71f1b9f81d672e31df2aa918676d85eadc28565c39a530ff069c227493f` |
| Author self-review | `docs/reviews/2026-09-08-oauth-edge-v4-alignment-v1-self-review.md` | `5e72412babe2987d66f16725f938ba9cfc7d82efa563b79fb0df8fa6bc39eed6` |

## Provenance and prior-authority disposition

The candidate derives its 33 exact bindings and scope tuples from accepted Native API V4
requirement revision 3 and design revision 7. It preserves `contracts/oauth-edge.md`, the existing
V1/provider-compatible edge behavior, and the V4 application's ownership of payloads, responses,
404, and 405. It adds no API version, producer, persistence, CLI, or V5 behavior.

## In scope

- recognize the 33 accepted V4 method/path bindings;
- require every scope in each binding's ordered tuple before upstream invocation;
- keep empty-scope V4 discovery routes bearer-authenticated;
- preserve the existing protected-header and private Modal-credential boundary; and
- forward authenticated unknown-path and unsupported-method requests to the V4 application for its
  contract response.

## Out of scope

- V4 payload or response translation;
- changes to V1/provider-compatible routing;
- CLI command design or implementation; 
- WorkOS role/grant provisioning;
- deployment, Cloudflare/DNS/secret mutation, live requests, Git publication, or release; and
- broader edge redesign or unrelated implementation controls.

## Acceptance criteria and unknowns

Local acceptance requires exhaustive 33-binding scope tests, multi-scope conjunction tests, V1
regression, private-header secrecy, no-upstream denial, and exact request/response forwarding. Later
milestone evidence separately requires an authorized deployment/readback and authenticated public
smoke.

Current unknowns are the deployed edge configuration, complete WorkOS scope provisioning, and live
public-host behavior. They remain rollout evidence and do not expand this requirement.

## Proposed independent-review questions

1. Are all 33 method/path/scope tuples exactly equal to accepted V4 design revision 7?
2. Does the forwarding rule preserve V4 404/405 ownership while retaining bearer validation?
3. Does any candidate statement change V1/provider-compatible behavior or weaken the existing
   credential/header boundary?
4. Does the candidate correctly require every member of multi-scope tuples and return the complete
   ordered tuple on denial?
5. Has any rollout, CLI, V5, or implementation-control concern become a requirement blocker without
   owner authority?

## Owner route

Choose exactly one:

- `REVISE`: return to candidate authoring;
- `REVIEW_THEN_REVISE`: add owner questions, independently review, then return to authoring;
- `REVIEW_THEN_DECIDE`: add owner questions, independently review, then return for the second owner
  decision; or
- `REVIEW`: independently review the questions above, then return for the second owner decision.

The recommended route is `REVIEW`. It tests the exact bounded transport delta without adding another
decision subject. Independent review cannot accept or edit the requirement.

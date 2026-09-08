# OAuth edge V4 alignment revision 1 self-review

- Date: 2026-09-08
- Lifecycle step: 1 self-review
- Candidate: `docs/requirements/oauth-edge-v4-alignment.v1.md`
- Candidate SHA-256: `a2d0c71f1b9f81d672e31df2aa918676d85eadc28565c39a530ff069c227493f`
- Result: `PASS_FOR_FIRST_OWNER_REVIEW`

## Source provenance and prior authority

PASS. The candidate separates five identities: public `/v4`, accepted V4 requirement revision 3,
accepted V4 design revision 7, deployed image-platform commit `7ba3867`, and this edge requirement
revision 1. It preserves the existing edge contract and adopts only the 33 accepted binding/scope
tuples. Existing implementation is feasibility evidence, not requirement authority.

## Scope and exclusions

PASS. The required delta is limited to V4 method/path classification, full scope conjunction, and
transport through the existing protected edge. V4 payloads, errors, producers, persistence, CLI,
WorkOS configuration, deployment, publication, and live requests are excluded. V1 and provider-
compatible behavior are explicitly preserved.

## Assumptions and unknowns

The candidate relies on these reviewed assumptions:

1. the public edge and V4 application validate the same WorkOS bearer and scope vocabulary;
2. the edge can forward the bearer unchanged while privately adding Modal proxy credentials; and
3. the deployed V4 application remains authoritative for unknown paths and unsupported methods.

The following remain unknown and do not alter the candidate:

- whether every V4 scope is currently provisioned in WorkOS roles and grants;
- the deployment-time edge configuration and Cloudflare secret state; and
- live behavior through the public hostname after a later authorized deployment.

These are rollout evidence or separate effects, not reasons to add product behavior to this
requirement.

## Acceptance criteria

PASS. The candidate requires local verification of all 33 exact method/path/scope tuples, zero-scope
authenticated routes, complete conjunction for two- and three-scope routes, no-upstream denial,
exact forwarding, private-header protection, and the unchanged V1 matrix. Deployment and public
authenticated smoke remain separately authorized milestone evidence.

## Compatibility and external namespace

PASS. `/v4` is already owned by accepted Native API V4. This candidate exposes that namespace
through an existing hostname; it does not assign a new API version. V1/provider-compatible routes
remain available and unchanged.

## Normative and non-normative inputs

PASS. The accepted V4 requirement and design provide the normative binding/scope contract. The
deployed binding test confirms the implemented set but cannot expand it. Current edge code and tests
show the existing security mechanism and missing V4 classifier but are non-normative implementation
evidence.

## Proposed independent-review input

The reviewer should receive only the digest-pinned candidate and the first-owner packet. It should
check:

1. exact equality of all 33 method/path/scope tuples with accepted V4 design revision 7;
2. whether the unknown-path/unsupported-method rule preserves V4 404/405 ownership without bypassing
   bearer validation;
3. whether any statement changes V1/provider-compatible behavior or weakens the existing edge
   credential/header boundary;
4. whether multi-scope conjunction and its challenge are complete and ordered; and
5. whether any rollout, CLI, V5, or implementation-control concern has become an acceptance blocker.

Findings must be classified as contradiction, evidence gap/unknown, optional/future, or out of scope.
They must not be inserted into the requirement automatically.


# OAuth edge V4 alignment revision 1 second owner-review result

- Date: 2026-09-08
- Lifecycle step: 4 result
- Owner response: `お願いします。`
- Owner decision: `ACCEPT`
- Requirement status: `ACCEPTED`
- Requirement candidate changed: no
- Independent-review status: `COMPLETED`

## Exact accepted requirement

The owner accepts this requirement snapshot and no other requirement bytes:

| Role | Path | SHA-256 |
| --- | --- | --- |
| Accepted requirement revision 1 | `docs/requirements/oauth-edge-v4-alignment.v1.md` | `a2d0c71f1b9f81d672e31df2aa918676d85eadc28565c39a530ff069c227493f` |

The candidate file remains byte-identical to the snapshot reviewed at lifecycle steps 2 and 3. Its
embedded draft-stage metadata is historical snapshot content; this result is the acceptance record.

## Accepted boundary

The edge will recognize the accepted 33 V4 method/path bindings, enforce every member of each
ordered scope tuple before upstream invocation, preserve authenticated zero-scope discovery routes,
and retain the existing protected-header and private Modal-credential boundary. Existing V1 and
provider-compatible behavior remains unchanged. V4 request, response, producer, persistence, CLI,
and V5 behavior remain outside this requirement.

## Authority boundary

The owner's instruction also authorizes local implementation and verification of this accepted
requirement. It does not authorize commit, push, deployment, WorkOS/Cloudflare/DNS/secret mutation,
release, or live requests.

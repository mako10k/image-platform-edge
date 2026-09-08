# OAuth edge V4 WIP — 2026-09-08

The owner requested handoff, WIP commit, push and continuation tomorrow. Stop ordinary work
after this closeout; do not schedule retries or change the shared workday end.

## Continuation

- Worktree: `/home/katsumata-m/.codex/worktrees/oauth-edge-v4-alignment/image-platform-edge`.
- Branch: `codex/oauth-edge-v4-alignment`.
- Push destination: same-named branch on `https://github.com/mako10k/image-platform-edge.git`.
  The old upstream `fix/issue-1-scope-parity` is not the continuation write target.
- Main-worktree credential domain: `/home/katsumata-m/image-platform-edge`.
- Implementation: `4b80e12db1a09be758d07eddf4d990c46de602d2`.
- Coordinating image branch: `codex/native-api-v2-interface-alignment` in
  `https://github.com/mako10k/image-platform.git`.
- Detailed evidence and exact restart procedure: that image branch's
  `docs/handoffs/2026-09-08-oauth-edge-v4-wip.md`.

## Deployment and incomplete smoke

Worker `image-platform-oauth-edge-staging` at `api-staging.image.mk10.org` was deployed and
read back at 100% version `abf009e5-b1d7-48ef-8ffe-44d81b54755a`, tag `sha-4b80e12`,
created `2026-09-08T13:17:25.437Z`. Source change preserves application-owned V4 response
request identity. No credential/configuration replacement was performed.

Local CI passed: 74 tests, TypeScript typecheck and Wrangler deploy dry-run.
The requirement acceptance record is
`docs/reviews/2026-09-08-oauth-edge-v4-alignment-v1-second-owner-review-result.md`;
the frozen candidate's original draft header does not supersede that acceptance record.

Unauthenticated public GET capabilities returned 401. Two authenticated public GET attempts
returned 403 after successful token issuance; neither reached the planned image-operation POST.
The second diagnostic found no recognized V4 metadata/error code, challenge or request ID.
That does not prove Worker JWT validation passed or even that the Worker received the request.

One direct Modal GET at `2026-09-08T13:43:44.216537Z` succeeded with HTTP 200, API version 4,
and matching request ID `req_07c73b195fbc4a9bba99279f368bb4fd`. It used the existing credentials
from `/home/katsumata-m/image`. A prior missing-secret conclusion came from inspecting the
wrong domain; no new M2M secret is needed.

Root cause remains unknown. Next diagnostic: correlate a safely captured public GET response
(error shape, CF-Ray, proxy headers, time) with available Worker logs to identify the rejecting
layer. Client-network intermediary, Cloudflare front door, forwarding and upstream rejection
remain alternatives. Confirm observation coverage before inferring anything from absent logs.
Only investigate credential/upstream mismatch as the source cause after locating that boundary.

The coordinating portfolio task is suspended for closeout at `2026-09-08T22:49:45+09:00`.
The public-edge readiness milestone is incomplete and the dependent CLI alignment remains
suspended. Direct GET success and local CI do not satisfy public GET/POST acceptance.
Consumed one-off retry approvals do not authorize automatic additional retries tomorrow.
Keep WorkOS/Modal secrets and access tokens out of logs, files and command arguments.

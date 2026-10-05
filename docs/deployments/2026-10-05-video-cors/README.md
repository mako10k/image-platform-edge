# Authorized existing Worker CORS repair

On 2026-10-05 the owner explicitly approved deployment after review of the running Worker candidate. This receipt supplements the historical NON_GPU_CI_READY closure and does not rewrite it.

Target: image-platform-oauth-edge-staging, serving api-staging.image.mk10.org. Existing compiled index.js was downloaded and pinned at SHA-256 0e46a0c6177609544e2f60f90dd1374c36737a28b1156afb1d4212086b58dd2e. Its only source change appends Location and Idempotent-Replay to the existing Access-Control-Expose-Headers literal. Candidate SHA-256 3d8ab9a92f731642bad6369b3fe645104765f0106318ef3a3f502275586bcf90. Both compiled artifacts are retained here because the connected default branch lacks the deployed CORS source; that older checkout was not deployed over the current Worker.

Before the single upload, live source SHA and full settings were read and compared with the reviewed snapshots. PUT Workers Script Upload used the original settings, retained plaintext/rate-limit bindings, and keep_bindings secret_text to preserve private secret bindings. No secret values were retrieved or committed. Routes/domains were not changed.

The upload succeeded at 2026-10-05T01:09:34.0895Z with deployment_id 054c60ded7d542f5954bc4374547186b. Live source readback matched the candidate. A strict full-settings comparison then stopped on Cloudflare's server annotation workers/triggered_by changing from version_upload to upload. No upload retry occurred. The difference was inspected and runtime settings/bindings were proven identical after excluding only that server annotation.

Verification: Node syntax check and check-candidate.mjs passed against the actual compiled handler with a mocked 202 upstream. Location and Idempotent-Replay are retained/exposed and an unapproved origin is denied. Authenticated live GET of the user's existing completed Job returned 200, allow-origin https://image.mk10.org and the corrected expose list. Live unapproved-origin OPTIONS remained 403 without allow-origin. No new inference or Job submission was performed.

Completed Job: job_374ccb44a8064bfe86f5d67d89c0baf3. Existing video retrieval/playback remains a browser acceptance step; this receipt does not claim a new live POST or playback test.

Future source-based delivery must reconcile the deployed CORS wrapper with this checkout before deployment. The compiled artifacts are bounded incident evidence, not a replacement TypeScript implementation. Credentials/private settings remain outside Git. No remote Git publication was performed.

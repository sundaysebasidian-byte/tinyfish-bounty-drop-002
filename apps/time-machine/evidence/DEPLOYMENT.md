# Deployment evidence

URL: https://tinyfish-time-machine.sundaysebasidian.workers.dev

Worker version: `790552ac-0862-4288-bdea-ddf981fe021e`.

29 passing unit/integration tests, TypeScript checks, JavaScript syntax check and production API audit passed. Production webhook results: wrong token 401 in 290 ms; wrong Monitor 403 in 852 ms; duplicate valid delivery 200 in 517 ms.

The real Wikipedia run-now returned unchanged, recorded a manual check and created no duplicate snapshot. No synthetic changes were injected. All 26 stored snapshots (25 active sources plus one retired source) have verified images and valid chains. Each page passed as-of, structured diff and JSON export checks.

Estimated incurred app spend: **$0.247**. Conservative committed projection through November 17: **$2.557**, plus $0.004 reserved per future screenshot. This projection retains the unused AWS reservation for safety. Automatic stop: $3.20; hard cap $4. Wallet rates confirm $0.005/Monitor run, $0.002/Browser minute, free Fetch and Search. Shared-account wallet movement is not attributed solely to this app.

Pending: three elapsed live days, actual scheduled changes with stored screenshots, inspection of resulting diffs, final polish/video, and user-owned submission/posting.

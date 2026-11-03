# Verification — 2026-11-03

- `npm test`: 8/8 passed, including parsing recorded real Fetch HTML, missing selectors/changed metadata, deduplication, cross-origin link rejection, literal-escaped robots lines, budget ceiling/cooldown, and the scheduled-handler persistence path (injected test report; not claimed as a real cron firing).
- `npm run typecheck` and `npm run build`: passed.
- HTTP MCP SDK smoke: five tools listed; search/get_film/get_screenings worked for Akira and search/get_film worked for 2001: A Space Odyssey. See `evidence/live-smoke.log`. Recorded before the Agent-tool pivot; the three read tools are unchanged.
- Real Claude Code conversation: search → facts → screenings completed; `demo-transcript.md` contains the actual conversation. The assistant's inferred dates/end times are explicitly distinguished from source fields.
- Independent local stdio smoke via `npx --prefix . site-to-mcp`: five current tools listed and a real Fetch-backed `get_film` succeeded. See `evidence/stdio-smoke.log`.
- A foreign Origin POST returned HTTP 403 `FORBIDDEN_ORIGIN`.
- Final `npm run health`: exit 1 as required, identifying `filter_programme` / `PAID_GUARD_UNAVAILABLE`; the three read tools passed. See `evidence/health-final.log`.
- TinyFish Agent HTTP 403 explicitly states the account lacks custom-max-steps beta access. Two capped requests were refused before execution; actual paid spend **$0.00**. D1 cost reservations were reconciled to zero and exported into the ignored `.cost-log.jsonl`. No uncapped fallback or paid retries were performed. Agent filter clicks remain **NOT_VERIFIED**.
- Scheduled daily cron (`0 8 * * *`) deployed successfully; a production scheduled firing has **not yet been observed**. `/health` truthfully has no stored scheduled report until that firing.
- Deployed Worker version: `176d43a0-b3e2-4980-80db-45ecc1210112`.
- No repository creation, pushes, social posts, submission or registration performed. Mandatory Agent execution and entrant-controlled eligibility/posts remain incomplete.
- Closeout: zero files moved; current source, dependencies, local state, credential, probes and evidence retained. See `closeout/manifest.json`; no freed-space claim.

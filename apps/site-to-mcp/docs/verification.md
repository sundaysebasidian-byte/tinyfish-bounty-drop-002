# Verification — 2026-11-03

- `npm test`: 12/12 passed. Includes real Fetch fixtures, markup drift, cross-origin links, robots rules, budget ceiling/cooldown, the scheduled-handler persistence path, original-run recovery after a gateway timeout, unconfirmed filter rejection, the accepted duration request and actual-cost settlement (including a response above the reservation estimate).
- `npm run typecheck` and `npm run build`: passed. Logs in `evidence/`.
- Real Agent execution, Fetch comparison and final deployed health are recorded in the evidence files below. The Agent request is bounded by `max_duration_seconds:90`; cost is settled from reported steps at $0.016 each. A $0.32 reservation estimates cost, not a provider-enforced dollar cap. The $2 allocation stops new reservations above $1.60, with a global ten-minute cooldown and six-hour result cache.
- Initial health during the pre-existing cooldown passed all three read tools and correctly refused a new Agent run, at zero additional spend. See `evidence/health-cooldown.log`.
- `demo-transcript.md` records a real Claude Code conversation through the deployed MCP endpoint: search → facts → screenings → interactive filter. Filter cache use and its original source timestamp are explicit.
- Prior HTTP MCP and local stdio smoke evidence remains in `evidence/live-smoke.log` and `evidence/stdio-smoke.log`. Five tools were listed. Read tools worked with Akira and 2001: A Space Odyssey.
- Foreign Origin POST returned HTTP 403 `FORBIDDEN_ORIGIN` in the earlier verification.
- Daily cron (`0 8 * * *`) is deployed; an actual scheduled firing has not yet been observed. Its persistence handler is tested with an injected report. `/health` serves the last scheduled report; manual health is `npm run health`.
- No push, social post, submission or registration performed. Entrant-controlled eligibility and mandatory public posts remain outstanding. Browser is deliberately omitted because it adds no meaningful capability to this workflow; Search, Fetch and Agent are the three endpoint integrations.
- Closeout: no files moved. Current source, dependencies, local state, credentials, evidence and deliverables retained. See `closeout/manifest.json`; no freed-space claim.

## Agent evidence

- Lead-reported initial probe: 10 steps, $0.160. Imported into the shared D1 ledger so the budget includes it.
- Attempt 1: 7 steps, $0.112; failed acceptance because the Agent could not locate Apply and incorrectly returned an empty result. Health caught it. `evidence/agent-attempt-1.json` and `evidence/health-agent-attempt-1.log` preserve the result. The inaccurate cache was removed and application/empty-state evidence is now validated.
- Attempt 2: 8 steps, $0.128; applied 35mm and returned 10 films. The synchronous gateway returned HTTP 524, but the same run completed; its original result was retrieved through the official Runs API without another paid call. See `evidence/agent-run-recovery.json`. The transport now supports bounded read-only recovery, covered by a regression test.
- Total new implementation spend: $0.240. Total known TinyFish spend including the lead probe: $0.400. No unresolved reservation; accounting evidence is `evidence/capability-cost-record.json` and `evidence/run-reconciliation.json`. Exported cost log remains gitignored.
- `max_duration_seconds:90` is the requested execution bound. The provider's recovered run timestamps span 126 seconds; do not interpret this setting as a guaranteed end-to-end HTTP deadline.
- `evidence/agent-fetch-verification.json` cross-checks every returned title/ID and 35mm screening against live TinyFish Fetch. This verifies provenance and format, while the Agent supplies the visible interaction evidence; it does not claim that ten returned cards exhaust the programme.

- Final deployed `npm run health`: exit 0, all four business tools passed; Agent cache explicitly carries source timestamp `2026-11-03T18:33:27Z`. See `evidence/health-final.log`.
- Final deployed Worker version: `bdc0ad4b-05dc-4368-b927-ee85929e0d34`.

# TinyVerify

Source-linked, reusable official registry checks. TypeScript + Hono Worker, static UI and D1. No search result is treated as verification. No hiring verdict is inferred.

## Run

```sh
npm ci
cp .env.example .dev.vars # supply secrets locally; never commit
npm run dev
```

Deploy: create a D1 database, put its ID in `wrangler.toml`, set `PUBLIC_BASE_URL`, run `npx wrangler d1 migrations apply tinyverify --remote`, set the API key and an unpredictable admin token using `npx wrangler secret put TINYFISH_API_KEY` / `ADMIN_TOKEN`, then `npm run deploy`. Each project is independent. No repo or social posting is performed by this app.

## JSON API

```sh
BASE=https://tinyverify.sundaysebasidian.workers.dev
curl -G "$BASE/api/verify" --data-urlencode 'name=00445790' \
  --data-urlencode 'record_type=company_registration' --data-urlencode 'jurisdiction=UK'
curl -G "$BASE/api/verify" --data-urlencode 'name=robinhood' \
  --data-urlencode 'record_type=broker_registration' --data-urlencode 'jurisdiction=US'
curl "$BASE/api/registries"
curl -X POST "$BASE/api/receipts" -H 'Content-Type: application/json' \
  -d '{"registry":"companies","record_number":"00445790"}'
curl "$BASE/api/receipts/RECEIPT_UUID"
curl -X POST "$BASE/api/receipts/RECEIPT_UUID/recheck" -H 'Content-Type: application/json' -d '{}'
curl "$BASE/api/discover?name=TESCO%20PLC&registry=companies"
curl -X POST "$BASE/api/watches" -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H 'Content-Type: application/json' -d '{"receipt_id":"RECEIPT_UUID"}'
curl "$BASE/api/watches/WATCH_UUID"
curl -X POST "$BASE/api/deep-check" \
  -H 'Content-Type: application/json' -d '{"name":"SWINERTON BUILDERS"}'
```

`name`, `record_type` and `jurisdiction` are required. `kind=organisation|person` defaults to organisation; person routing currently supports NPI only. `registry` optionally pins the adapter. Record types and jurisdictions are listed in `/api/registries`; `any` / `Global` request broad coverage (maximum five adapters). An explicit record type routes before identifier heuristics. Without a supported adapter the response is `no_registry_for_query` with guidance. Identifier detection for `record_type=any` narrows to one registry; manually pin a registry to disambiguate numeric identifiers. ABN and Charity Commission require record numbers. Names retain all returned candidates, including aliases; `name_match` is a comparison hint, never an automatic identity selection. Outcomes are `match`, `no_match`, `multiple_matches`, or `registry_error`. Errors never become no-match. `truncated` warns when a ten-result limit may hide more matches. A single candidate is not proof of identity.

Receipts carry the registry number, exact source status, normalised status, expiry / next renewal (nullable), disciplinary actions (nullable), official link, checked time, SHA-256 of fetched text and canonical record hash. Null means the source does not supply or the adapter does not assess that field; it does not mean no discipline. Receipts persist for 90 days. `/r/UUID` offers recheck and JSON download. Response hashes are evidence fingerprints, not authority signatures; raw personal contact fields are never exposed in receipts.

## Coverage and TinyFish use

| Registry                             | Access                 | Input / limits                                                                                  |
| ------------------------------------ | ---------------------- | ----------------------------------------------------------------------------------------------- |
| CMS NPI                              | Fetch JSON             | Organisation / person name or NPI; NPI is an enumeration, not state licence validation          |
| FINRA BrokerCheck firms              | Fetch JSON             | Firm name / CRD; official undocumented interface; disclosures are not a finding of discipline   |
| Companies House                      | Fetch HTML as markdown | Company number or name; search fails loudly if links are missing                                |
| GLEIF                                | Fetch JSON             | Legal name / LEI; next renewal is labelled as such                                              |
| FDIC BankFind                        | Fetch JSON             | Bank name / certificate number                                                                  |
| ABN Lookup                           | Fetch HTML as markdown | ABN number                                                                                      |
| Charity Commission (England & Wales) | Fetch HTML as markdown | Charity number; reporting status is preserved; registration status stays unknown                |
| California CSLB                      | Agent                  | Capped public JS-form search bounded by `max_duration_seconds: 90` (~10 steps ≈ $0.16), cached 24 hours |

**Fetch** retrieves live official content via `POST https://api.fetch.tinyfish.ai`, TTL 3600 seconds; explicit recheck uses TTL 0. Hosts and redirects are allowlisted. Parser drift yields `registry_error`. Recorded fixtures are real official responses; NPI fixtures remove authorised-official contacts. No fixture is served as live data.

**Search** provides source discovery via `/api/discover`, restricted to the registry's official host. It helps locate a record and is clearly labelled unverified; adapters must Fetch the authority before issuing evidence.

**Agent** uses CSLB's form workflow with a 90-second duration limit, no automatic retries and a 24-hour cache. Cached results require no paid admission. Uncached public runs are limited atomically to three/day globally and one/IP/day, alongside the existing $0.60 daily Agent and $2.40 total admission limits. The UI offers an explicit Agent button. Names use a Unicode letter/number and punctuation whitelist (2–100 characters) and are passed as quoted literal data. Each run reserves $0.32; actual cost is recorded as `num_of_steps × $0.016`, retaining `reserved_usd` separately. Unknown-cost failures retain the reservation. There is no supported hard step cap: runs over 20 steps are flagged and block further paid admission pending review. The duration setting is not a guaranteed dollar ceiling (the recorded run exceeded 90 seconds). Runs queue with HTTP 202; the UI polls the returned run ID and requests cancellation after 120 seconds or 20 observed steps. Poll until terminal to settle actual cost. `RESUME_RUN_ID=...` lets the evidence script recover an existing run without another paid execution.

**Monitor** creates one real TinyFish Fetch Monitor per watched receipt, daily at 09:00 UTC. An unpredictable per-watch webhook token and stored `fetch_monitor_id` authenticate deliveries. Run IDs deduplicate retries. Full results are parsed with the same adapter; status, source status, renewal and disciplinary flags are compared against the last successful record and persisted in D1 events. Failed / missing records produce `registry_error` events and preserve baseline. `run-now` does not deliver a webhook (TinyFish behavior); scheduled deliveries do. Ordinary watches expire after seven days; admin-created `curated: true` business demos last 18 days (19 daily checks including baseline, $0.095 reserved). The TESCO demo is extended through 21 November; hourly Worker cron pauses them, retains history, and records pause failures. Agent-only CSLB watches are refused because Fetch cannot verify that form. Webhook URLs are secret capabilities; never publish them.

Budget: $3 cap, admission stops before $2.40 (80%). D1 atomically reserves estimated costs before paid API calls; global wallet must retain $3. Agent daily reservation cap $0.60; Monitor $0.20. Each seven-day daily watch reserves $0.04 (eight possible checks including baseline), conservatively ignoring the first 72-hour free period. D1 is the authoritative cost log; `scripts/live-smoke.mjs` exports it to gitignored `.cost-log.jsonl`. Agent HTTP 400/403 validation or access refusals release reservations (no execution); failed/uncertain paid requests retain reservations to prevent accidental overspend. Monitor reservations are conservative estimates; completed Agent rows hold measured step cost with the original reservation retained separately. The lead-reported prior 10-step CSLB run is reconciled as a separate $0.16 cost entry (its insertion timestamp is the reconciliation time). Scheduled Monitor costs depend on the external scheduler; inspect `last_error` if pausing fails. No automatic top-ups.

## Validation

`npm run typecheck`; `npm test` tests each enabled Fetch parser against recorded official fixtures and malformed-source handling, ambiguity, variants, unknown fields, redirects, and status-change comparison. `npm run record` refreshes Fetch fixtures using a local key. `BASE_URL=... node --env-file=.dev.vars scripts/live-smoke.mjs` records deployment checks; `CREATE_WATCH=true` and `RUN_AGENT=true` explicitly opt into bounded paid operations. Inspect evidence before changing supported coverage.

Limits: no NMLS automation (terms), FCA unreachable, CalBar not fixture-validated, TDLR excluded by the one-Agent-registry budget. No broad identity matching, criminal checks, legal advice, or guarantee of complete disciplinary history. Public API is rate-limited to 30 requests/IP/minute; public Agent runs have additional daily limits; Monitor creation requires admin auth. No public write API for credentials. Business / public-entity examples only.

Submission remains the owner's responsibility: eligibility, video/GIF, required LinkedIn tag and Discord showcase posting; nothing is posted or submitted automatically.

## Deployment verification (2026-11-03)

Live URL: https://tinyverify.sundaysebasidian.workers.dev . Seven Fetch adapters returned real records, including multi-candidate FINRA/NPI results; real TESCO receipt creation and fresh recheck passed. A real daily TESCO Monitor is active through 2026-11-21 (watch `89c70216-e849-4c33-b0d6-0e592ed8ce07`). A fresh Fetch using the Monitor config (markdown, links/image links disabled, TTL 0) parses successfully in `fixtures/companies-monitor-markdown.json` and a regression test. Scheduled webhook delivery and a real status change remain unobserved.

**CSLB live execution:** on 2026-11-03 the lead’s independently retrieved run `60495483-27f1-4bd9-b993-a9828d6e90e6` used 10 steps ($0.16). The review-validation run `7203f253-4e0e-4bea-82ea-3eec74e62606` completed in 17 steps ($0.272), returning five candidates including the three above and cancelled joint ventures 777297 and 801117. Its initial synchronous connection closed; the same run was recovered by ID, without another paid run. `agent-evidence.json` records the successful live HTTP 200 result and actual cost. Public cached replay was verified. Remaining submission assets: GIF/video and owner-managed submission.

Current daily curated watches: TESCO / Companies House (`89c70216-e849-4c33-b0d6-0e592ed8ce07`, expires 2026-11-21T18:06:38.244Z); Apple / GLEIF (`a94a5a7e-3d43-4489-800e-9692907bc8de`, expires 2026-11-21T18:23:21.991Z). Agent step spend totals $0.432; Monitor future-check reservations total $0.190, for $0.622 accounted spend plus commitments, below $3. No optional second Agent registry was added.

Review fix: candidates are ranked by current-name similarity, with exact current names first. Companies House previous names remain source-provided aliases and are labelled “Matched former name” when that historical name explains the hit better than the current name. The live TESCO PLC check puts 00445790 first and labels KFORD TYRES (GORNAL) LTD with its actual former name TESCO TYRES LTD. See review-live-evidence.json and tests/ranking.test.ts. This revision used no paid Agent runs; the D1 ledger totals $0.432 measured Agent cost plus $0.190 Monitor reservations ($0.622 accounted, Monitor actuals not yet confirmed).

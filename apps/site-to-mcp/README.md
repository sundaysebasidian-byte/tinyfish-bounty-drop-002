# Prince Charles Cinema → MCP

Plan a cinema visit with typed, source-linked film facts, screenings and complete format discovery. TinyFish does the source reading. No accounts, reservations or purchases.

- MCP endpoint (Streamable HTTP, no authentication): https://site-to-mcp-pcc.sundaysebasidian.workers.dev/mcp
- Landing page: https://site-to-mcp-pcc.sundaysebasidian.workers.dev/
- Health: https://site-to-mcp-pcc.sundaysebasidian.workers.dev/health

## Install

| Client | Setup |
|---|---|
| Claude Code | `claude mcp add --transport http pcc https://site-to-mcp-pcc.sundaysebasidian.workers.dev/mcp` |
| Claude Desktop | `claude_desktop_config.json`: `{"mcpServers":{"pcc":{"command":"npx","args":["-y","mcp-remote","https://site-to-mcp-pcc.sundaysebasidian.workers.dev/mcp"]}}}` |
| Cursor | `.cursor/mcp.json`: `{"mcpServers":{"pcc":{"url":"https://site-to-mcp-pcc.sundaysebasidian.workers.dev/mcp"}}}` |
| ChatGPT | Settings → Connectors → create a connector with the endpoint URL |
| stdio | `npx --prefix /absolute/path/to/apps/site-to-mcp site-to-mcp` |

Other Streamable HTTP clients can connect without authentication. Client setup is not a claim of testing every host application. See the [real MCP client planning conversation](docs/demo-transcript.md), including async Agent and pagination.

stdio bridges to the hosted MCP; set `SITE_TO_MCP_URL` to override. Offline local mode requires the key in environment, with paid calls disabled by default. Never commit credentials or cost logs.

## Tools

| Tool | Inputs | Output / primitive |
|---|---|---|
| search_films | query | Search discovers indexed titles; Fetch validates against the complete live programme |
| get_film | film_id | Fetch: title, year, runtime, certificate, country, genre, director |
| get_screenings | film_id | Fetch: screening IDs, dates, London times, tags, booking links; no inferred availability |
| list_by_format | modifier: 35mm/70mm/4K/HOH, offset=0, limit=100 (max 300) | Fetch: films, total, offset, limit, next_offset; follow next_offset until null |
| filter_programme | modifier | Agent UI verification plus the complete Fetch film list; cached 6h, otherwise PENDING with run_id |
| get_run_result | run_id | Poll only a run started by this server; PENDING or validated final result |
| health_check | none | Fetch-only live checks plus explicit timestamped cached Agent replay |

Every final source result includes a source URL and checked_at. Filtering includes films with matching sold-out shows. Agent final films are the complete Fetch set, not the Agent's ten-card sample. This is film-level format discovery, not a seat inventory.

MCP errors return isError and `{error:{code,message}}`. Invalid arguments are INVALID_INPUT; missing selectors, contradictory Agent/Fetch data and invalid source structures fail SITE_CHANGED. Budget, cooldown, disabled paid calls and failed Agent runs are explicit errors. No uncertainty is reported as an empty successful result.

## Health

- `GET /health` returns the latest persisted cron/manual health_check report. MCP `health_check` refreshes it.
- Daily cron: 08:00 UTC. It uses **Fetch only**, sharing live programme and Akira facts/screenings reads, checking format tags and the filter Apply control. It validates and replays last-agent-success, including the original checked_at and run_id. It does **not** claim this is a fresh Agent probe.
- No scheduled live Agent probes exist; the cron spends zero Agent steps through Nov 17. Fetch/Search use their free allowance; allowance exhaustion/provider errors still fail honestly.
- Known-film fixtures deliberately fail if Akira leaves the programme.
- A cached Agent replay remains available after the paid admission stop and does not expire with the normal six-hour tool cache. No guarantee of future upstream uptime is implied.
- Live Agent runs happen only on explicit filter_programme requests, never health checks. Global ten-minute cooldown, six-hour cache, atomic $0.32 estimated reservation and $1.60 admission stop protect the $2 app allocation. Agent duration bound is 90s, not a provider-enforced dollar ceiling. Actual cost is reported steps × $0.016; ambiguous failures retain reservations. Do not run a separate local paid ledger against the same allocation.

## How TinyFish is used

- **Fetch** reads the programme, film pages and screenings. It exposes the complete programme's format tags: a live 3 November probe found **71 35mm films**. Applying the UI filter is **not necessary** to discover them; use list_by_format for that job. Fetch uses 10 seconds for robots and 40 seconds for HTML, with a 30-second URL timeout. Source reads are cached in D1 for five minutes, in addition to the five-minute provider TTL.
- **Search** discovers indexed titles for search_films.
- **Agent** has a narrower role: checking that the site's JavaScript dropdown and Apply interaction still work, with click evidence and a sample cross-checked against Fetch. This is an honest UI-verification fallback, not a claim that Agent is indispensable for reading the catalogue. Agent stays on /whats-on/ and forbids booking, seat selection, ticket quantities, login, personal data and checkout.
- **Async execution.** Verified official APIs: [POST /v1/automation/run-async](https://docs.tinyfish.ai/agent/api/agent) returns run_id immediately; [GET /v1/runs/{id}](https://docs.tinyfish.ai/agent/api/runs) retrieves it. No synchronous run, 524 guessing, run-list search or automatic paid retry. A new filter call returns typed PENDING immediately after start; get_run_result returns immediately after one read-only status request. Agent start/status requests have a 20-second bound. Step costs settle exactly once, even if completion is polled repeatedly. Ambiguous starts retain their reservation.

## Why this site

We first investigated read-only booking availability. Fetch exposes some Sold Out markers in the programme, so those cannot justify Agent use. The booking-page Fetch probe timed out (recorded in docs/evidence/booking-fetch.json); a timeout does not establish that seat data is absent from HTML. More decisively, the site's robots.txt explicitly disallows `/prince-charles-cinema/booknow/` (docs/evidence/robots.txt). We therefore did not send an Agent into that flow and cannot substantiate a safe interactive seat-availability tool. No seat availability endpoint is advertised.

## Verify and deploy

```sh
npm ci
npm run typecheck
npm test
npm run build
npm run health
```

Deploy your own: update wrangler.toml account/Worker/D1 identifiers, apply schema.sql, set the TINYFISH_API_KEY Worker secret and run `npx wrangler deploy`. Scripts/export-costs.ts exports production D1 paid records to gitignored .cost-log.jsonl. docs/verification.md and older evidence describe previous revisions; the current review evidence and transcript supersede their ten-card and synchronous-run claims.

## Review notes

No push, public posts or bounty submission were performed. Eligibility and owner submission remain with the entrant.

Review validation (3 Nov): 15 offline tests and typecheck pass. One new live Agent attempt, f96a0232-17eb-4685-b6c2-1b97c7beb1bc, completed in 5 steps ($0.080) but reported filter_applied=false; it is correctly rejected. The previous verified 8-step successful baseline is migrated with its original Agent timestamp and freshly fetched complete results. Current measured app spend is **$0.480** ($0.400 prior + $0.080 this revision); no new live Agent retries were made. See docs/evidence/agent-review.json, health-review.json and the real MCP transcript. Agent duration configuration did not prevent a several-minute wall-clock execution; async polling keeps the Worker free of that wait.

The review also fixed top-level MCP union output compatibility and enabled JSON responses for stateless calls. Large programme pages now build a DOM only for extracted title anchors; format discovery scans card tags without constructing the entire screening DOM. This addresses live Worker resource-limit failures observed during multi-step verification. Source fixtures and pagination tests cover the complete format set.

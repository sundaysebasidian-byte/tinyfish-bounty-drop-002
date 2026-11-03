# Time Machine

Read `00-overview.md` first for the stack, `@hackerson/tinyfish` and the env vars.

## Winning angle

**Pitch:** A tamper-evident record of every change to the pages you care about: screenshot before and after, word-level diff, hash-chained.

Why it can place top 3:
- **Evidence, not just alerts.** Each change is stored as a snapshot: text, screenshot, SHA-256 of both, and a hash chain linking it to the previous snapshot. A "Verify chain" button recomputes every hash in the browser. Use cases: terms-of-service changes, pricing changes, policy pages, government notices.
- **Visual and textual together.** A before/after screenshot slider sits on top of a word-level diff. Noise lines (timestamps, "x minutes ago", counters) are filtered and collapsed.
- **Real history on demo day.** Curated Monitors start on day 1 (Nov 4–5), so the demo scrubs through about 12 days of real changes rather than a staged edit.
- **Cheap and honest.** TinyFish Monitor does the scheduling and change capture ($0.005/check). The paid Browser screenshot ($0.002/min) runs **only when the text changed**. The cost per page per month is shown on the page.

## How TinyFish Monitor reports changes (confirmed from docs)

Sources: https://docs.tinyfish.ai/monitor/index.md, https://docs.tinyfish.ai/monitor/api-reference.md

- A Page Monitor (`type:"fetch"`) runs Fetch with `ttl:0` on a cron (`schedule_cron`, 5-field, UTC or a `CRON_TZ=` prefix). It compares the extracted content with the previous run.
- Creating a Monitor runs it immediately. The `201` response holds `{monitor, run}`, with `run.is_baseline: true` and `run.results[]` (Fetch result shape: `url, final_url, title, text, …`).
- **Webhook:** every *scheduled* run is POSTed to `webhook_url`, **including runs with no changes**. Payload: `{fetch_monitor_id, id, is_baseline, results:[…], errors:[]}`. The payload carries **no diff, no `changed` flag and no signature**. Delivery is best effort with up to 3 retries.
- **Run now** (`POST /v1/monitors/{id}/runs`) returns `201 {run}` but **does not send the webhook**.
- **No REST run-history endpoint.** History exists only in the dashboard, so we must persist every run ourselves.
- `purpose` is evaluated by TinyFish, but the assessment shows only in the dashboard and is not echoed in API responses. We still send `purpose`, and we do not depend on it.
- Limits: 50 Monitors per account. Page config accepts only `url, format, links, image_links`; there is **no selector scoping**, so we scope and normalise ourselves.

So: **we compute change detection and diffs ourselves** from `results[0].text` (markdown).

## Screenshots (confirmed from docs)

Monitor and Fetch return no images; Fetch rejects image content types. Options:
1. **Browser API (chosen).** `POST https://api.browser.tinyfish.ai {url, timeout_seconds:120}` → `{session_id, cdp_url}` → `playwright-core` `chromium.connectOverCDP(cdp_url)` → `page.screenshot()` → `DELETE https://api.browser.tinyfish.ai/{session_id}`. Doc: https://docs.tinyfish.ai/browser-api/reference.md (its end-to-end example does exactly this). Cost about $0.002–0.004 per capture.
2. Fallback: Agent `capture_config.screenshots` plus `GET /v1/runs/{id}/steps/{stepId}/screenshot` (https://docs.tinyfish.ai/agent/api/runs). It costs about 5× more per capture, so use it only if Browser returns `404 NOT_FOUND` (Browser not enabled).

## Scope

**MVP**
1. Track a page: URL plus name, with schedule `every 6h` or `daily`. This creates a TinyFish Monitor whose webhook points at us; the baseline run is stored and a baseline screenshot taken.
2. Webhook ingestion: normalise, hash, compare; on change, store the snapshot, compute the diff and capture a screenshot (async via `after()`).
3. "Check now" button (owner/admin): calls run-now and processes the result inline.
4. Page timeline: scrubber with change ticks, before/after screenshot slider, word diff, snapshot metadata.
5. Hash chain plus client-side "Verify chain".
6. Four curated public pages (below), seeded on day 1.
7. Public "Track a page": at most 10 public slots, daily schedule only, Monitor deleted after 7 days, 1 per IP per day.

**Stretch**
- S1 Export an evidence pack: a ZIP of `manifest.json` (chain), texts and PNGs.
- S2 Per-page ignore rules (regex list) editable by the owner.
- S3 Email or Slack-style outgoing webhook on change.
- S4 BYOK: the user pastes a TinyFish key, so Monitors are created on *their* account and the slot caps are lifted. The key is encrypted with `WEBHOOK_SECRET`-derived AES-GCM and used only for Monitor CRUD.
- S5 An "Import from Wayback" baseline, using the Internet Archive's CDX lookup via Fetch.

**Non-goals**
- Pages behind login; selector-level visual diff; pixel diffing of screenshots.
- Sub-hourly schedules; topic (search) monitors.
- User accounts beyond an owner token per page.

## Architecture

```
Track page ──POST /api/pages──▶ create Page{id} ─▶ tf.monitors.create({type:"fetch", name, config:{url, format:"markdown"},
                                                      schedule_cron, purpose, webhook_url: BASE/api/hooks/monitor/{pageId}?t={token}})
                                                ─▶ ingest(page, resp.run, "baseline")

TinyFish Monitor (cron) ──POST /api/hooks/monitor/{pageId}?t=…──▶ verify token + fetch_monitor_id ─▶ ingest(page, payload, "scheduled")
Check now ──POST /api/pages/{id}/check──▶ tf.monitors.runNow(monitorId) ─▶ ingest(page, run, "manual")

ingest():
  text = results[0].text → normalize(text, rules) → sha256
  record check {ts, runId, changed}
  if changed or baseline:
     put text → Blob  snapshots/{pageId}/{snapId}.md
     diff vs previous normalized text → stats
     chainHash = sha256(prevChain | textSha | ts)        (screenshot hash appended when ready, see below)
     respond 200 immediately; after(): captureScreenshot(final_url) → Blob .jpg → update snapshot {shotUrl, shotSha, chainHash2}
```

Chain definition (recomputable client-side):
`link_n = sha256(link_{n-1} + "\n" + textSha_n + "\n" + (shotSha_n ?? "-") + "\n" + capturedAt_n)`, with `link_0 = sha256("time-machine:" + pageId)`. A screenshot arriving late updates `link_n` only if it is still the newest snapshot. Otherwise it is stored with `shotSha` outside the chain and flagged `late:true` (keeps the chain stable).

Webhook security: `token = HMAC_SHA256(WEBHOOK_SECRET, pageId)` (base64url). Reject when the token mismatches **or** `payload.fetch_monitor_id !== page.monitorId`. Idempotency: skip if `payload.id` (run id) is already in `checks:{pageId}`.

Normalisation (`normalize.ts`): collapse whitespace; drop lines that match the defaults `/\b\d+\s+(seconds?|minutes?|hours?)\s+ago\b/i`, `/^(updated|last updated)[: ].{0,40}$/i`, `/\b\d{1,2}:\d{2}(:\d{2})?\s?(am|pm|utc)?\b/i` (time-only lines), plus per-page rules (S2); strip `?utm_*` from links. Diffs use the `diff` package: `diffWordsWithSpace` for display and `diffLines` for stats.

Screenshot (`screenshot.ts`):
```ts
export async function captureScreenshot(tf: TinyFish, url: string): Promise<{ jpg: Uint8Array; sha256: string; width: number; height: number }>
// guard.assertPaidAllowed("browser", 0.004) → tf.browser.create({url, timeout_seconds: 120})
// → chromium.connectOverCDP(cdp_url) → page = contexts()[0].pages()[0] ?? newPage()
// → setViewportSize(1280×900) → goto(url,{waitUntil:"domcontentloaded",timeout:30000}) → waitForLoadState("networkidle",{timeout:8000}).catch(()=>{})
// → screenshot({type:"jpeg", quality:70, fullPage:true, clip capped at 1280×6000})
// finally: browser.close(); tf.browser.terminate(session_id)
```
`next.config.ts`: `serverExternalPackages: ["playwright-core"]`. Webhook route: `export const runtime = "nodejs"; export const maxDuration = 60;`.

## Data model

Redis:
- `page:{id}` → `{id, url, name, monitorId, schedule:"6h"|"daily", createdAt, expiresAt?, public:boolean, ownerTokenHash, ignore:string[], lastCheckedAt, changeCount, checkCount}`
- `pages:public` → sorted set (score `createdAt`); `pages:curated` → list
- `checks:{pageId}` → sorted set, score ts, member JSON `{runId, ts, changed, source:"baseline"|"scheduled"|"manual", error?}`
- `snaps:{pageId}` → list of snapIds (oldest first); `snap:{snapId}` → `{id, pageId, runId, capturedAt, title, finalUrl, textUrl, textSha, shotUrl?, shotSha?, link, prevId?, stats:{added, removed, pct}}`
- `slots:public:count`, `rl:track:{ip}`, budget counters (see overview)

Blob paths: `snapshots/{pageId}/{snapId}.md`, `snapshots/{pageId}/{snapId}.jpg` (public read, unguessable snapId = ULID).

Cron strings: `6h` → `0 */6 * * *`; `daily` → `0 9 * * *`.

## File tree

```
apps/time-machine/
├─ app/
│  ├─ page.tsx                              # Home: track input + page list
│  ├─ p/[pageId]/page.tsx                   # Timeline view (?s=snapId selects snapshot)
│  ├─ api/pages/route.ts                    # POST create (public slot or ADMIN_TOKEN), GET list
│  ├─ api/pages/[id]/check/route.ts         # POST run-now (owner/admin)
│  ├─ api/pages/[id]/snapshots/route.ts     # GET snapshots + checks (for timeline + verify)
│  ├─ api/hooks/monitor/[pageId]/route.ts   # Monitor webhook
│  └─ api/cron/expire/route.ts              # daily: delete expired public monitors (Vercel cron, 1/day OK on Hobby)
├─ lib/
│  ├─ ingest.ts        # ingest(page, run, source): Promise<{changed: boolean; snap?: Snapshot}>
│  ├─ normalize.ts     # normalize(text, rules?): string
│  ├─ diff.ts          # diffStats(a,b): {added, removed, pct}; renderDiff(a,b): DiffPart[]
│  ├─ chain.ts         # link(prev, textSha, shotSha, ts): Promise<string>; verifyChain(snaps): Promise<{ok, brokenAt?}> (Web Crypto, shared client/server)
│  ├─ screenshot.ts    # captureScreenshot(...)
│  ├─ monitors.ts      # createForPage(page), deleteForPage(page), webhookUrl(pageId)
│  ├─ tokens.ts        # webhookToken(pageId), ownerToken()
│  ├─ store.ts         # Redis + Blob accessors
│  └─ types.ts
├─ scripts/seed-curated.ts   # creates the 4 curated pages (ADMIN_TOKEN), prints monitor ids
├─ scripts/check-browser.ts  # day-1 check: create + screenshot + terminate a session, prints cost estimate
├─ fixtures/                 # recorded monitor create/run payloads, two versions of a page
└─ tests/*.test.ts
```

## Curated demo targets (Fetch-verified 2026-11-03)

| Page | URL | Schedule | Why |
|---|---|---|---|
| Wikipedia current events | https://en.wikipedia.org/wiki/Portal:Current_events | 6h | Changes daily; guarantees a dense timeline (27 KB markdown fetched) |
| GitHub Changelog | https://github.blog/changelog/ | 6h | New entries most weekdays (fetched; dated entries visible) |
| Anthropic Consumer Terms | https://www.anthropic.com/legal/consumer-terms | daily | The "terms watch" story; rare changes (29 KB fetched) |
| TinyFish Pricing | https://www.tinyfish.ai/pricing | daily | On-theme for judges; fetched cleanly |

Monitor cost for these: 10 checks/day × $0.005 = $0.05/day. Purpose strings: "A new news item is added", "A new changelog entry is published", "Any clause of the terms changes", "Any price or limit changes".

## UI screens (content and layout only)

1. **Home `/`**
   - Top: one URL input + a schedule toggle (`6h` / `daily`; public users get `daily` only) + a "Track" button. Below it, one muted line: remaining public slots, as "3 of 10 slots open".
   - A list of tracked pages, one row each: favicon, name, domain (mono), last change (relative), changes count, and a 14-day strip of ticks (filled = change, hollow = check without change). Curated pages come first.
2. **Timeline `/p/{pageId}`**
   - Header: name, URL (mono, external link), "Checked {n} times · {m} changes · every 6h", and the cost line "≈ $0.60/month".
   - The scrubber spans the full width: a horizontal track, change ticks as dots and checks as hairlines, with date labels at the ends. Clicking a dot selects that snapshot; arrow keys step.
   - Main: a **before/after slider** of the two screenshots (previous ↔ selected), with captured-at labels in the corners. If a screenshot is missing, show a neutral placeholder card with "No screenshot" and the reason.
   - Below: **Diff**, with tabs `Changes` (changed hunks only, ±2 lines of context) and `Full`. Insertions get the accent tint, deletions are struck through in muted red. Noise lines collapse into "n noise lines hidden".
   - Side rail (desktop) or bottom (mobile): snapshot meta (captured at, Monitor run id, text SHA-256 truncated with copy, screenshot SHA-256, chain link) and a **Verify chain** button. The button's result: "Chain intact · 23 snapshots", or "Broken at snapshot 7".
3. **Empty state** (new page, baseline only): the baseline screenshot and "Next check {relative time}". Nothing else.

## Demo script (80 s)

1. 0–6 s: Home. The four curated pages show their tick strips; Wikipedia has a dense strip.
2. 6–25 s: Open Anthropic Consumer Terms (or whichever curated page has a real change). Drag the scrubber to the change and pull the before/after slider. The diff shows the changed clause.
3. 25–35 s: Click Verify chain → "Chain intact · n snapshots". Copy a SHA-256.
4. 35–55 s: Back on Home, paste `https://github.blog/changelog/` (already tracked) or a new public URL → Track. The baseline screenshot appears within about 20 s.
5. 55–70 s: On the GitHub Changelog timeline, step through 3 days of changes with the arrow keys.
6. 70–80 s: Caption: "Monitor checks · screenshots only on change · ≈ $0.60/page/month". URL and repo.

## Acceptance criteria

- [ ] Unit tests pass. They cover: normalize (noise lines removed, stable output), diffStats, chain link and verify (a tamper test flips one byte → `brokenAt`), webhook token verify, ingest idempotency (same run id twice → one check), ingest no-change (check recorded, no snapshot).
- [ ] `scripts/check-browser.ts` produces a JPEG ≥ 50 KB of https://www.tinyfish.ai/pricing, and the session is terminated (DELETE returns 204).
- [ ] The webhook rejects a wrong token (401) and a mismatched `fetch_monitor_id` (403), and answers 200 in under 1 s with the screenshot deferred.
- [ ] Creating a page returns the baseline snapshot with a screenshot within 60 s.
- [ ] By Nov 10, Wikipedia and GitHub Changelog each have ≥ 5 snapshots in prod.
- [ ] Public slot cap: the 11th public track returns 429 with "No public slots left". The expire cron deletes the Monitor (verified with `GET /v1/monitors/{id}` → 404) and keeps the history read-only.
- [ ] Budget guard: with `PAID_CALLS_ENABLED=false`, ingest still stores the text snapshot and marks the screenshot `skipped: "paid_disabled"`.
- [ ] Verify chain runs in the browser with Web Crypto (no server call beyond loading the data).

## Executor task list

1. Scaffold `apps/time-machine` (Next.js, `@hackerson/ui`, Vitest, `@upstash/redis`, `@vercel/blob`, `playwright-core`, `diff`, `ulid`). **Check:** dev server runs.
2. Write `scripts/check-browser.ts` and run it once. **Check:** JPEG saved and session terminated. If it fails with 404, stop and report (switch to the Agent screenshot fallback).
3. Implement `normalize.ts`, `diff.ts` and `chain.ts` plus tests. **Check:** tests pass.
4. Implement `tokens.ts`, `store.ts` and `ingest.ts` (screenshot injected as a function for tests) plus tests with fixtures. **Check:** tests pass.
5. Implement the webhook route, `api/pages` POST (admin path only first) and `monitors.ts`. **Check:** a local test with a recorded payload via curl stores a check.
6. Deploy to Vercel (Redis, Blob, env vars). Run `scripts/seed-curated.ts` against prod. **Check:** 4 Monitors exist (`GET /v1/monitors`) and 4 baselines with screenshots are in Blob. **Do this by Nov 5.**
7. Implement `api/pages/[id]/check` (run-now) and confirm ingest on a manual run. **Check:** the run is recorded with `source:"manual"`.
8. Implement `api/pages/[id]/snapshots` and the Timeline page (scrubber, slider, diff, meta, verify). **Check:** walk through the curated pages in prod.
9. Implement Home (list plus tick strips) and public Track with slot caps, per-IP limit and a 7-day expiry. **Check:** acceptance items for slots.
10. Implement `api/cron/expire` plus a `vercel.json` cron (daily). **Check:** manually trigger it with an expired test page.
11. Mid-build check, Nov 10: ≥5 snapshots on the 6h pages; look over the noise filtering on Wikipedia diffs and add default rules if needed (no schedule change).
12. Hand off to Sonnet for styling, then DeepSeek for review.
13. Stretch S1 evidence ZIP (`fflate`), then S2 ignore rules.
14. Write the README and record the video on Nov 14–15 using real history.

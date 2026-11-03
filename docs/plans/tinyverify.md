# TinyVerify

Read `00-overview.md` first for the stack, `@hackerson/tinyfish` and the env vars.

## Winning angle

**Pitch:** Verify a doctor, broker, lawyer or company against the official registry, in seconds, with a source-linked receipt.

Why it can place top 3:
- **Official sources only.** Every adapter is pinned to a government or self-regulatory-organisation (SRO) domain. Aggregators are refused by design, and every result cites the authority by name.
- **A verdict, not a page dump.** Each registry is normalised to one vocabulary: `Active`, `Inactive`, `Lapsed`, `Dissolved`, `Not found`, `Ambiguous`, `Source unavailable`, plus flags (`Disciplinary history`, `Disclosures`, `Overdue filings`). The app never reports "not licensed" when the source failed.
- **Receipts.** Each check produces a permalink with the registry, the official record URL, retrieval time, SHA-256 of the raw response and the normalised fields. It can be shared with a client or compliance file.
- **Smart input.** One box. Identifiers are recognised automatically (NPI with Luhn check, LEI, UK company number, ABN). A name fans out in parallel to every registry relevant to the person/organisation toggle.
- **Free, with proof.** Every MVP registry runs on TinyFish Fetch (all verified live below). A paid "Deep check" via the Agent exists only for form-only registries and is off by default.
- **Safe by default.** NMLS is shown as "Not supported: registry terms prohibit automated access", which demonstrates restraint in the demo.

## Registry research (Fetch-tested 2026-11-03)

| Registry | Authority | Access | Verified result | Use |
|---|---|---|---|---|
| NPI Registry | CMS (US) | JSON API `https://npiregistry.cms.hhs.gov/api/?version=2.1&number={npi}` or `&first_name=&last_name=&state=&limit=10` | ✅ JSON, `result_count:1`, `basic.status`, taxonomies with state license numbers | MVP |
| FINRA BrokerCheck | FINRA (SRO) | JSON `https://api.brokercheck.finra.org/search/individual?query={q}&nrows=10&start=0&wt=json`, `/search/firm?query=` | ✅ individuals (`ind_bc_scope`, `ind_bc_disclosure_fl`, current employments) and firms (`firm_scope`, `firm_disclosure_fl`). Undocumented interface used by FINRA's own site | MVP |
| State Bar of California | State Bar of CA | HTML `https://apps.calbar.ca.gov/attorney/LicenseeSearch/QuickSearch?FreeText={q}`, detail `https://apps.calbar.ca.gov/attorney/Licensee/Detail/{barNo}` | ✅ results table (Name/Status/Number/City/Admission) and detail with status history and discipline columns | MVP |
| Companies House | UK Registrar | HTML `https://find-and-update.company-information.service.gov.uk/search/companies?q={q}`, detail `/company/{number}` | ✅ search list and detail (status, type, incorporated, accounts and confirmation statement due dates, SIC) | MVP |
| GLEIF LEI | GLEIF | JSON `https://api.gleif.org/api/v1/lei-records?filter[entity.legalName]={name}`, `/lei-records/{lei}` | ✅ `entity.status`, `registration.status`, next renewal | MVP |
| FDIC BankFind | FDIC | JSON `https://api.fdic.gov/banks/institutions?search=NAME:{q}&fields=NAME,CERT,ACTIVE,STNAME,CITY&limit=10`, `filters=CERT:{n}` | ✅ `ACTIVE:1`, CERT 628 = JPMorgan Chase Bank, N.A. (note: `banks.data.fdic.gov` redirects to `api.fdic.gov`) | Stretch S1 |
| ABN Lookup | Australian Business Register | HTML `https://abr.business.gov.au/ABN/View?abn={abn}` | ✅ entity name, ABN status, GST | Stretch S1 |
| Charity Commission | UK Charity Commission | HTML `https://register-of-charities.charitycommission.gov.uk/charity-search/-/charity-details/{n}` | ✅ OXFAM 202918, reporting status | Stretch S1 |
| CSLB contractors | California CSLB | `LicenseDetail.aspx?LicNum=` **redirects to the search form** | ⚠️ needs the Agent (ASP.NET postback) | Stretch S2 (Deep check) |
| TDLR | Texas TDLR | `https://www.tdlr.texas.gov/LicenseSearch/` renders "Loading..." (JS) | ⚠️ needs the Agent | Stretch S2 |
| FCA Register | UK FCA | `register.fca.org.uk` → Fetch `target_unreachable` | ❌ untested with the Agent; skip | — |
| NMLS Consumer Access | CSBS/SRR | Redirects to `TuringTestPage.aspx`; terms forbid scraping | 🚫 refused by design | Shown as unsupported |

All MVP calls go through `POST https://api.fetch.tinyfish.ai` (https://docs.tinyfish.ai/fetch-api/reference). JSON endpoints are parsed with `parseJsonFromFetch` (see overview). Use `ttl: 3600` for name searches and `ttl: 0` when the user presses "Re-check" on a receipt.

## Scope

**MVP**
1. One input + a `Person / Organisation` toggle + an optional jurisdiction chip (`US`, `CA`, `UK`, `Global`).
2. Identifier detection → a single adapter with a definitive verdict.
3. Name → parallel fan-out to applicable adapters (≤5 Fetch URLs), streaming results per registry.
4. Candidate list → detail → receipt.
5. Receipt permalink `/r/{id}` (Redis, 90-day TTL), with Re-check and JSON download.
6. Registry directory page `/registries` (what is covered, the authority, the access method, unsupported entries with reasons).

**Stretch**
- S1 FDIC, ABN and Charity Commission adapters (each about 1 hour; all verified).
- S2 Deep check with the Agent for CSLB and TDLR. Off unless `PAID_CALLS_ENABLED`; capped at 3/day; `output_schema` for `{found, name, license_number, status, expiration, classifications[], disciplinary_actions}`; `agent_config.max_duration_seconds: 90`; cost badge "≈ $0.20".
- S3 MCP endpoint `/api/mcp`: tools `verify_identifier(id)`, `search_registries(name, kind, jurisdiction?)`, returning the receipt URL. Reuses the mcp-handler pattern from Site to MCP.
- S4 Batch CSV (≤25 rows) → table plus a CSV with verdicts and receipt links.
- S5 Receipt screenshot of the human-facing record via Browser (paid, cap 5/day).

**Non-goals**
- Background checks or criminal records; any non-official source; storing searches that did not become receipts.
- Exhaustive 50-state coverage; legal advice or "safe to hire" judgements.

## Architecture

```
UI ──GET /api/verify?q=&kind=&j= (SSE)──▶ route(q, kind, j) ─▶ adapters[] ─▶ Promise.allSettled(adapter.search(q))
                                                                         └─ stream {registry, status, candidates[]}
UI ──POST /api/receipt {adapter, recordId}──▶ adapter.get(recordId) ─▶ normalize ─▶ save receipt ─▶ {id}
/r/{id} ──▶ load receipt (SSR); Re-check → POST /api/receipt/{id}/recheck (ttl:0)
```

Adapter interface:
```ts
// lib/adapters/types.ts
export type Kind = "person" | "organisation";
export type Status = "active" | "inactive" | "lapsed" | "dissolved" | "suspended" | "revoked" | "deceased" | "unknown";
export type Flag = "disciplinary_history" | "disclosures" | "overdue_filings";
export interface Candidate { recordId: string; name: string; subtitle: string; status: Status; flags: Flag[] }
export interface RecordDetail extends Candidate {
  fields: { label: string; value: string }[];        // ordered, human labels
  humanUrl: string;                                    // official page a person would open
  sourceUrl: string;                                   // URL actually fetched
}
export interface Adapter {
  id: "npi" | "finra-individual" | "finra-firm" | "calbar" | "companies-house" | "gleif" | "fdic" | "abn" | "charity-uk";
  registry: string; authority: string; jurisdiction: "US" | "US-CA" | "UK" | "AU" | "Global";
  kinds: Kind[]; officialDomains: string[];            // assertion: every fetched URL host ∈ officialDomains
  detect?(q: string): string | null;                   // returns recordId if q is this registry's identifier
  search(q: string, tf: TinyFish): Promise<Candidate[]>;
  get(recordId: string, tf: TinyFish, opts?: { fresh?: boolean }): Promise<{ detail: RecordDetail; raw: string }>;
}
```

Status mapping (per adapter, unit-tested):
- NPI: `basic.status === "A"` → active, else inactive. NPI is a registration, so show taxonomy license numbers as fields with the label "State license (self-reported to NPPES)".
- FINRA individual: `ind_bc_scope` / `ind_ia_scope` contains `Active` → active; `ind_bc_disclosure_fl === "Y"` → `disclosures`. Firm: `firm_scope` / `firm_ia_scope`; `firm_disclosure_fl`.
- CalBar: the Status column → `Active|Inactive|Deceased|Suspended|Disbarred(→revoked)|Resigned(→inactive)`; any non-empty Discipline cell in the history → `disciplinary_history`.
- Companies House: "Company status" → `Active|Dissolved|Liquidation(→inactive)`; the word "overdue" near accounts or confirmation → `overdue_filings`.
- GLEIF: `registration.status` `ISSUED` → active, `LAPSED` → lapsed, `RETIRED|ANNULLED` → inactive; `entity.status` `INACTIVE` → inactive.

Verdict for a lookup (`lib/verdict.ts`): `verdict(results: AdapterResult[]): "verified" | "found_with_flags" | "not_found" | "ambiguous" | "source_unavailable"`. A registry that errors yields `source_unavailable` for that registry only. A name search with more than one candidate whose name is an exact normalised match → `ambiguous`.

Identifier detection order: NPI (10 digits, Luhn over `"80840" + first 9` equals the 10th digit) → LEI (`^[A-Z0-9]{18}\d{2}$`) → UK company (`^(\d{8}|[A-Z]{2}\d{6})$`) → ABN (11 digits, ABN weighting checksum) → CalBar (only with jurisdiction `CA` and kind `person`, `^\d{1,6}$`).

Receipt:
```ts
interface Receipt { id: string; adapter: Adapter["id"]; registry: string; authority: string;
  recordId: string; detail: RecordDetail; retrievedAt: string;
  sha256: string;     // of raw response (changes if registry metadata changes, e.g. GLEIF publishDate)
  fieldsSha: string;  // of canonical JSON of detail.fields + status + flags; drives "No change since last check"
  rawExcerpt: string; // first 4 KB of raw, for transparency
  appVersion: string }
```
Redis: `receipt:{id}` (EX 90 days), `rl:verify:{ip}` (30/min), `rl:receipt:{ip}` (10/min).

## File tree

```
apps/tinyverify/
├─ app/
│  ├─ page.tsx                     # Search
│  ├─ r/[id]/page.tsx              # Receipt
│  ├─ registries/page.tsx          # Coverage directory
│  ├─ api/verify/route.ts          # SSE fan-out
│  ├─ api/receipt/route.ts         # POST create
│  └─ api/receipt/[id]/recheck/route.ts
├─ lib/
│  ├─ adapters/{npi,finra,calbar,companies-house,gleif}.ts   # + fdic, abn, charity-uk (S1)
│  ├─ adapters/index.ts            # registry list, applicable(kind, j)
│  ├─ adapters/unsupported.ts      # NMLS, FCA, CSLB/TDLR (until S2) with reasons
│  ├─ detect.ts                    # detectIdentifier(q): {adapter, recordId} | null  (luhnNpi, abnChecksum)
│  ├─ parse/markdown-table.ts      # parseMarkdownTable(md): string[][]  (CalBar)
│  ├─ parse/definition-list.ts     # parseLabelValueBullets(md): Record<string,string> (Companies House "* Company status | * Active")
│  ├─ verdict.ts
│  ├─ receipt.ts                   # createReceipt, getReceipt, sha256Hex
│  └─ deep-check.ts                # S2 Agent wrapper
├─ fixtures/                       # recorded Fetch outputs per adapter: search + detail + not-found
├─ scripts/record-fixtures.ts
├─ scripts/smoke.ts                # live: one known record per adapter, prints status
└─ tests/*.test.ts
```

## UI screens (content and layout only)

1. **Search `/`**
   - Centred: product name (small); one large input with placeholder "Name, NPI, LEI, company or bar number"; below it a segmented toggle `Person | Organisation` and jurisdiction chips. Nothing else above the fold.
   - Results appear below in **one section per registry** (registry name and authority on the left in muted text, a status pill on the right while loading → count). Each candidate row: name, subtitle (city/state or firm), status pill, flag pills. Clicking a row creates a receipt and navigates to it.
   - An identifier match skips the list and goes straight to the receipt.
2. **Receipt `/r/{id}`**
   - Top: a large verdict word with its colour (`Active` emerald, `Inactive`/`Lapsed` zinc, `Dissolved`/`Revoked` red, flags amber), then the name, then "per {authority}".
   - A two-column definition list of the normalised fields.
   - A "Source" block: official record link (`humanUrl`), fetched URL (mono), retrieved at (absolute + relative), SHA-256 (mono, copy).
   - Actions: `Re-check`, `Copy link`, `Download JSON`. A collapsible "Raw excerpt".
3. **Registries `/registries`**
   - A table: registry, authority, jurisdiction, what it covers, access (`Free · official API`, `Free · official page`, `Paid · agent`, `Not supported`), with a reason for unsupported entries. No prose header beyond the title.

## Demo targets (live-verified)

1. **FINRA firm "robinhood"**: firms with `ACTIVE` scope; TRADEPMR shows the disclosure flag `Y`, which demonstrates flags.
2. **Companies House `00445790`**: identifier detection → TESCO PLC, Active, next accounts due 26 Aug 2027.
3. **LEI `HWUPKR0MPOU8FGXBT394`**: Apple Inc., GLEIF record.
4. **CalBar "nakashima"** (CA, Person): 10 results with Active/Inactive/Deceased statuses. For the video, prefer opening an organisation or a public figure; blur private individuals' addresses.
5. **NMLS** row on `/registries`: "Not supported: terms prohibit automated access".

## Demo script (70 s)

1. 0–5 s: Search page. Type `00445790`.
2. 5–15 s: The receipt appears directly: **Active**, TESCO PLC, per Companies House. Hover the SHA-256 and click the official record link (it opens GOV.UK).
3. 15–30 s: Back; Organisation, "robinhood". BrokerCheck, GLEIF and Companies House sections stream in. One FINRA firm shows a `Disclosures` pill.
4. 30–42 s: Paste the LEI → Apple Inc. receipt. Press Re-check; the timestamp updates and "No change since last check" appears (based on `fieldsSha`).
5. 42–55 s: Person + CA, "nakashima". The CalBar list shows mixed statuses. Open one; the status history table appears.
6. 55–65 s: `/registries`: every row is official; NMLS is refused with a reason.
7. 65–70 s: Caption: "Official sources only · free TinyFish Fetch · receipts". URL and repo.

## Acceptance criteria

- [ ] Fixture tests per MVP adapter: search parse, detail parse, status mapping, not-found handling, error → `source_unavailable`.
- [ ] `detect.ts`: NPI Luhn (valid `1003000126`; invalid with the last digit changed), LEI, UK company number, ABN checksum (`33102417032` valid).
- [ ] An assertion in each adapter: every fetched URL host ∈ `officialDomains` (a test tries to inject `https://evil.example` → throws).
- [ ] `scripts/smoke.ts` prints, live: NPI 1003000126 active · FINRA firm "robinhood" ≥1 · CalBar 100000 inactive · Companies House 00445790 active · GLEIF HWUPKR0MPOU8FGXBT394 issued.
- [ ] A name search streams the first registry result in under 5 s; the total is under 20 s.
- [ ] A receipt page renders server-side from Redis without calling TinyFish; Re-check uses `ttl:0`, updates `retrievedAt`, and compares `fieldsSha` to show changed or unchanged.
- [ ] With Fetch forced to fail (test double), the UI shows "Source unavailable", never "Not found".
- [ ] No Agent or Browser calls in MVP code (grep).
- [ ] Rate limits enforced (30 verify/min/IP).

## Executor task list

1. Scaffold `apps/tinyverify` (Next.js, `@hackerson/ui`, Vitest, `@upstash/redis`, `node-html-parser`). **Check:** dev server runs.
2. Write `scripts/record-fixtures.ts` for the 5 MVP adapters (search, detail, not-found). Also check `format:"markdown"` vs `"html"` for the JSON endpoints and record which parses. **Check:** fixtures saved; a note in the README of the chosen format.
3. Implement `detect.ts` plus tests. **Check:** tests pass.
4. Implement the parsers (`markdown-table`, `definition-list`) plus tests on the CalBar and Companies House fixtures. **Check:** tests pass.
5. Implement adapters one at a time, each with tests: NPI → GLEIF → FINRA (individual + firm) → Companies House → CalBar. **Check:** each adapter's tests pass before the next starts.
6. Implement `verdict.ts` plus tests. **Check:** tests pass.
7. Run `scripts/smoke.ts` live. **Check:** all 5 lines are as expected.
8. Implement `api/verify` (SSE, `Promise.allSettled`, per-registry events) and `api/receipt` plus recheck, with rate limits. **Check:** `curl -N "/api/verify?q=robinhood&kind=organisation"` streams events.
9. Build the Search, Receipt and Registries screens. **Check:** the demo script works end to end locally.
10. Deploy to Vercel. **Check:** the smoke test against prod via the UI; receipts persist across deploys.
11. Hand off to Sonnet for styling, then DeepSeek for review.
12. Stretch S1 adapters (FDIC, ABN, Charity Commission), then S3 MCP endpoint, then S2 Deep check (one recorded CSLB run for the video, cost logged).
13. Write the README and record the video.

# Budget & constraints (binding for all executors)

Wallet: ~$11.18 total for all three builds. Prices: Search/Fetch free · Agent $0.016/step · Browser $0.002/min · Monitor $0.005/check (first 72h of a monitor free).

| Build | Cap | Notes |
|---|---|---|
| Time Machine | $4 | 20+ pages; high-churn every 6h, rest every 12h. Browser screenshot only on detected change. |
| TinyVerify | $3 | Prefer registries fetchable via Fetch/public API (NPI, Companies House...). Agent on at most one registry; cache results. |
| Site to MCP | $2 | Pick a site whose results are reachable by URL params (Fetch). Agent only where clicking is unavoidable. |
| Buffer | $2 | Dev/debug. |

Rules:
- Develop against Fetch first; call Agent only after the Fetch path works. Never loop paid calls.
- Log every paid call (primitive, est. cost) to `apps/<name>/.cost-log.jsonl` (gitignored); stop and report when 80% of the cap is reached.
- Each build should make 4 endpoints do real work (Search, Fetch, Agent, Browser, Monitor) — no padding.
- No API keys, passwords or private individuals' personal data in code, demo or screenshots. Demo with businesses / public entities.
- One submission per bounty, final — ship only polished work.
- Deadline: Tue 17 Nov 2026, 11:59 PM PT. Time Machine must be monitoring live ≥3 days before submit — start monitors ASAP.

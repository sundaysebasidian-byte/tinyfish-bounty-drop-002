# Live Monitor inventory

Verified 2026-11-03T18:31:01.938Z. **25 active Monitors**, one paused AWS source, and two deleted Monitors whose stored history is archived read-only.

Schedules use UTC. Five fast Monitors become daily (`0 9 * * *`) on November 6, three days after creation. Maintenance cron: `*/10 * * * *`.

| Page | Monitor ID | Current UTC schedule |
|---|---|---|
| Canada immigration notices | `e9c04f13-a0b4-43b8-9f84-578594d3bbd5` | `0 */6 * * *` |
| UK immigration health surcharge | `68b7f68b-a128-4b42-bb88-bf3bbf5ed07e` | `0 9 * * *` |
| UK immigration rule changes | `70da6108-1732-4082-8077-47ee5b61e23d` | `0 */6 * * *` |
| UK skilled worker visa fees | `67afcb50-41f2-4d8b-b3dc-9b735b5ec37a` | `0 9 * * *` |
| UK student visa fees | `249bf721-1802-4263-918a-7ae133ffb6e9` | `0 9 * * *` |
| USCIS immigration alerts | `85af25cb-8f4c-4d2e-882b-c8417087cbdb` | `0 */6 * * *` |
| Medicare costs | `9d9bac37-a51e-4572-bf7d-604bfaaf9be2` | `0 9 * * *` |
| Medicare coverage | `862384b2-8c97-4abc-b945-5d9e007c1df4` | `0 9 * * *` |
| IKEA US restaurant menu prices | `5c13e084-db64-4729-bcbd-4fde3fa282f7` | `0 9 * * *` |
| In-N-Out menu | `b1ac11b4-4274-434f-8f16-abd4dbee7423` | `0 9 * * *` |
| Wetherspoon food menu | `cc7e0d11-84ef-445b-9894-1fb3da7b1025` | `0 9 * * *` |
| Anthropic pricing | `41764e14-379b-48d8-8dab-1870878b9a14` | `0 9 * * *` |
| Cloudflare Workers pricing | `d48b1fe7-ed60-497c-9344-f8e6fb892afb` | `0 9 * * *` |
| GitHub pricing | `ddb1717a-19ae-4f03-b966-db152badb9d8` | `0 9 * * *` |
| Hetzner cloud pricing | `abcf244c-636b-4101-9e35-e6eaf1dc76e8` | `0 9 * * *` |
| OpenAI API pricing | `c76ae287-13b0-4909-9f3e-1c6d604f7d4c` | `0 9 * * *` |
| Supabase pricing | `caf73eb1-ab3c-46a9-b349-0b988dde578f` | `0 9 * * *` |
| TinyFish pricing | `d276c499-bc39-4fdf-a1bb-f404ffdc7ddf` | `0 9 * * *` |
| Vercel pricing | `518e3fa5-ab27-4b16-b70f-8a3d9afb8ade` | `0 9 * * *` |
| Anthropic consumer terms | `f643e8ba-99aa-478f-9c31-06be4bab61df` | `0 9 * * *` |
| Cloudflare privacy policy | `5267b416-7b53-4105-b24d-68ab5d0ea6f4` | `0 9 * * *` |
| GitHub privacy statement | `82cd3b43-430f-4dc3-8de2-e7570a099bb7` | `0 9 * * *` |
| OpenAI terms of use | `913ed57f-8c9c-482f-9f90-6cd9087ed48f` | `0 9 * * *` |
| GitHub Changelog | `773b5217-c923-4425-bb09-8e5b7575f3db` | `0 */6 * * *` |
| Wikipedia current events | `3a3c68a0-06c5-41bd-b4f0-c933ea529322` | `0 */6 * * *` |

Replaced Cloudflare Changelog with [UK student visa fees](https://www.gov.uk/student-visa), and OpenAI API changelog with [UK immigration health surcharge](https://www.gov.uk/healthcare-immigration-application/how-much-pay). Both new sources were Fetch-verified with concrete fee content (5,365 and 2,095 characters); raw responses are in `tests/fixtures/`. Both old Monitors were DELETEd and confirmed unreadable with HTTP 404; their snapshots remain queryable. See `review-monitor-delta.json`.

Wikipedia Current Events and GitHub Changelog remain high-churn sources, alongside immigration notices. Source changes cannot be guaranteed in advance. All 28 stored snapshots (25 active + 3 retained) passed chain and actual JPEG SHA-256 checks, including the two new baselines.

At the November 3 audit, the first fast delivery (November 4 00:00 UTC) and daily delivery (November 4 09:00 UTC) were still in the future. No scheduled delivery is claimed. Run this after November 4 09:00 UTC plus delivery latency; it exits unsuccessfully until every active page has a scheduled check:

```sh
curl --fail --silent --show-error https://tinyfish-time-machine.sundaysebasidian.workers.dev/api/health | jq -e '(.stale_pages | length) == 0 and (.scheduled_deliveries | length) >= 24 and all(.scheduled_deliveries[]; .last_scheduled_at != null)'
```

Cost ledger: incurred conservative estimate **$0.265**, committed schedule projection **$2.725** through November 17, including prior reservations for deleted sources (retained conservatively). A scenario with 60 further $0.004 screenshot reservations totals **$2.965**. Actual change counts and billing can vary; the $3.20 guard remains enabled. Shared wallet balance was **$11.429191**, which is not app-attributable spend.

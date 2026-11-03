# Live Monitor inventory

Verified 2026-11-03T18:18:38.504Z. **25 active Monitors**, plus one paused AWS source retained for audit.

Schedules use UTC. Fast Monitors become daily (`0 9 * * *`) on November 6, three days after creation, to fit the budget. Maintenance cron: `*/10 * * * *`.

| Page | Monitor ID | Current UTC schedule |
|---|---|---|
| IKEA US restaurant menu prices | `5c13e084-db64-4729-bcbd-4fde3fa282f7` | `0 9 * * *` |
| USCIS immigration alerts | `85af25cb-8f4c-4d2e-882b-c8417087cbdb` | `0 */6 * * *` |
| Hetzner cloud pricing | `abcf244c-636b-4101-9e35-e6eaf1dc76e8` | `0 9 * * *` |
| Wetherspoon food menu | `cc7e0d11-84ef-445b-9894-1fb3da7b1025` | `0 9 * * *` |
| In-N-Out menu | `b1ac11b4-4274-434f-8f16-abd4dbee7423` | `0 9 * * *` |
| Medicare costs | `9d9bac37-a51e-4572-bf7d-604bfaaf9be2` | `0 9 * * *` |
| Medicare coverage | `862384b2-8c97-4abc-b945-5d9e007c1df4` | `0 9 * * *` |
| UK skilled worker visa fees | `67afcb50-41f2-4d8b-b3dc-9b735b5ec37a` | `0 9 * * *` |
| Cloudflare privacy policy | `5267b416-7b53-4105-b24d-68ab5d0ea6f4` | `0 9 * * *` |
| GitHub privacy statement | `82cd3b43-430f-4dc3-8de2-e7570a099bb7` | `0 9 * * *` |
| OpenAI terms of use | `913ed57f-8c9c-482f-9f90-6cd9087ed48f` | `0 9 * * *` |
| Anthropic consumer terms | `f643e8ba-99aa-478f-9c31-06be4bab61df` | `0 9 * * *` |
| GitHub pricing | `ddb1717a-19ae-4f03-b966-db152badb9d8` | `0 9 * * *` |
| Supabase pricing | `caf73eb1-ab3c-46a9-b349-0b988dde578f` | `0 9 * * *` |
| Vercel pricing | `518e3fa5-ab27-4b16-b70f-8a3d9afb8ade` | `0 9 * * *` |
| Cloudflare Workers pricing | `d48b1fe7-ed60-497c-9344-f8e6fb892afb` | `0 9 * * *` |
| OpenAI API pricing | `c76ae287-13b0-4909-9f3e-1c6d604f7d4c` | `0 9 * * *` |
| Anthropic pricing | `41764e14-379b-48d8-8dab-1870878b9a14` | `0 9 * * *` |
| TinyFish pricing | `d276c499-bc39-4fdf-a1bb-f404ffdc7ddf` | `0 9 * * *` |
| OpenAI API changelog | `79cc0bac-4ce6-4569-9d2c-98fb2ccea53c` | `0 */6 * * *` |
| UK immigration rule changes | `70da6108-1732-4082-8077-47ee5b61e23d` | `0 */6 * * *` |
| Canada immigration notices | `e9c04f13-a0b4-43b8-9f84-578594d3bbd5` | `0 */6 * * *` |
| Cloudflare Changelog | `7246fc89-b95d-44b5-9069-8f065e2e7112` | `0 */6 * * *` |
| GitHub Changelog | `773b5217-c923-4425-bb09-8e5b7575f3db` | `0 */6 * * *` |
| Wikipedia current events | `3a3c68a0-06c5-41bd-b4f0-c933ea529322` | `0 */6 * * *` |

All 25 active baselines have stored JPEGs whose SHA-256 values and text chains passed the production audit. The paused AWS baseline is retained with its repaired screenshot. Its loading-placeholder Fetch result was rejected after manual review.

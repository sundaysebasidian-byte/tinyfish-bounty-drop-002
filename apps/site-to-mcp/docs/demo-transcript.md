# Real MCP conversation

Recorded 2026-11-03 using the installed Claude Code CLI, strict MCP configuration `docs/mcp-demo.json`, and the live Streamable HTTP endpoint. No responses below are simulated. Client runtime and model choices are recorded by the CLI, not inferred.

## User

Find Akira in the current programme, read its runtime and director, then get screenings and compare its first two 35mm options with dates and local times. Use actual tool calls in that order; do not guess. Do not check booking yet.

## Assistant → ToolSearch

```json
{
  "query": "select:mcp__pcc__search_films,mcp__pcc__get_film,mcp__pcc__get_screenings",
  "max_results": 3
}
```

## MCP result

```json
[
  {
    "type": "tool_reference",
    "tool_name": "mcp__pcc__search_films"
  },
  {
    "type": "tool_reference",
    "tool_name": "mcp__pcc__get_film"
  },
  {
    "type": "tool_reference",
    "tool_name": "mcp__pcc__get_screenings"
  }
]
```

## Assistant → mcp__pcc__search_films

```json
{
  "query": "Akira"
}
```

## MCP result

```json
"{\"source_url\":\"https://princecharlescinema.com/whats-on/\",\"checked_at\":\"2026-11-03T18:06:26.431Z\",\"films\":[{\"film_id\":\"1808\",\"title\":\"Akira\",\"url\":\"https://princecharlescinema.com/film/1808/akira\"}],\"total_in_programme\":295,\"indexed_matches\":10}"
```

## Assistant → mcp__pcc__get_film

```json
{
  "film_id": "1808"
}
```

## MCP result

```json
"{\"source_url\":\"https://princecharlescinema.com/film/1808/akira/\",\"checked_at\":\"2026-11-03T18:06:42.059Z\",\"film_id\":\"1808\",\"title\":\"Akira\",\"year\":1988,\"runtime_minutes\":125,\"certificate\":\"(15)\",\"country\":\"Japan\",\"genre\":\"Anime\",\"director\":\"Katsuhiro Ôtomo\"}"
```

## Assistant → mcp__pcc__get_screenings

```json
{
  "film_id": "1808"
}
```

## MCP result

```json
"{\"source_url\":\"https://princecharlescinema.com/film/1808/akira/\",\"checked_at\":\"2026-11-03T18:06:59.207Z\",\"film_id\":\"1808\",\"timezone\":\"Europe/London\",\"screenings\":[{\"performance_id\":\"31627780\",\"date_label\":\"Friday 6th November\",\"time\":\"8:45 pm\",\"tags\":[\"35mm\",\"SUB\"],\"booking_url\":\"https://princecharlescinema.com/prince-charles-cinema/booknow/31627780\"},{\"performance_id\":\"31627781\",\"date_label\":\"Saturday 7th November\",\"time\":\"2:35 pm\",\"tags\":[\"35mm\",\"SUB\"],\"booking_url\":\"https://princecharlescinema.com/prince-charles-cinema/booknow/31627781\"},{\"performance_id\":\"31627783\",\"date_label\":\"Tuesday 10th November\",\"time\":\"3:10 pm\",\"tags\":[\"35mm\",\"SUB\"],\"booking_url\":\"https://princecharlescinema.com/prince-charles-cinema/booknow/31627783\"},{\"performance_id\":\"31627784\",\"date_label\":\"Thursday 12th November\",\"time\":\"8:45 pm\",\"tags\":[\"35mm\",\"SUB\"],\"booking_url\":\"https://princecharlescinema.com/prince-charles-cinema/booknow/31627784\"},{\"performance_id\":\"31627860\",\"date_label\":\"Friday 27th November\",\"time\":\"11:15 am\",\"tags\":[\"4K\",\"SUB\"],\"booking_url\":\"https://princecharlescinema.com/prince-charles-cinema/booknow/31627860\"},{\"performance_id\":\"31628707\",\"date_label\":\"Friday 15th January\",\"time\":\"5:50 pm\",\"tags\":[\"4K\",\"SUB\"],\"booking_url\":\"https://princecharlescinema.com/prince-charles-cinema/booknow/31628707\"}]}"
```

## Assistant

I found Akira (1988, film ID 1808) in the current Prince Charles Cinema programme. It runs **125 minutes** and is directed by **Katsuhiro Ôtomo**. Its first two 35mm screenings are:

| | Date | Local time (London) | Format | Performance ID | Approx. finish* |
|---|---|---|---|---|---|
| 1 | Friday 6 November | 8:45 pm | 35mm, SUB | 31627780 | ~10:50 pm |
| 2 | Saturday 7 November | 2:35 pm | 35mm, SUB | 31627781 | ~4:40 pm |

*I worked out the finish times by adding the 125-minute runtime to the start time. They don't include trailers or ads, so the film will likely end later.

- Both are subtitled 35mm prints. The only difference is when they run: Friday is a late evening slot and Saturday is a weekend afternoon.
- The listing doesn't give a year, but 6 November 2026 is a Friday, so these dates match the current programme.
- Akira has two more 35mm screenings (10 and 12 November) and two 4K ones.
- I haven't checked seat availability.

Sources:
- Programme: https://princecharlescinema.com/whats-on/
- Film details and screenings: https://princecharlescinema.com/film/1808/akira/

The runtime returns London source date labels without assigning years; any year/end-time arithmetic in the assistant answer is the model’s inference.

The conversation was recorded before the Agent-tool pivot; its three read tools are unchanged. The delivered `filter_programme` Agent tool is blocked by account beta access and is not represented as successfully called here.

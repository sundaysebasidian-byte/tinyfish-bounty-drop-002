import { writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import assert from "node:assert/strict";
import { load } from "cheerio";
import { TinyFish } from "../src/tinyfish.js";
import { filterOutput, ORIGIN } from "../src/schema.js";
import { catalogue } from "../src/parse.js";

// Credentials are loaded only into this process, never into evidence.
assert.ok(
  process.env.TINYFISH_API_KEY,
  "Set TINYFISH_API_KEY in the process environment",
);
const tf = new TinyFish(process.env.TINYFISH_API_KEY);
const raw = execFileSync(
  "npx",
  [
    "wrangler",
    "d1",
    "execute",
    "site-to-mcp-pcc",
    "--remote",
    "--command",
    "SELECT value FROM cache WHERE key='filter:35mm'",
    "--json",
  ],
  { encoding: "utf8" },
);
const rows = JSON.parse(raw)[0].results;
assert.equal(rows.length, 1, "A successful live 35mm run must exist");
const result = filterOutput.parse(JSON.parse(rows[0].value));
const programme = catalogue((await tf.page(`${ORIGIN}/whats-on/`)).text);
const comparisons = [];
for (let i = 0; i < result.films.length; i += 4) {
  comparisons.push(
    ...(await Promise.all(
      result.films.slice(i, i + 4).map(async (f) => {
        const source = programme.find((p) => p.film_id === f.film_id);
        assert.ok(source, `${f.film_id} missing from live Fetch programme`);
        assert.equal(source.title, f.title);
        const page = await tf.page(f.url);
        const $ = load(page.text);
        const formatTags = $(".date-row .tag").filter(
          (_, el) => $(el).text().trim() === result.modifier,
        );
        assert.ok(
          formatTags.length,
          `${f.title} has no ${result.modifier} screening`,
        );
        return {
          film_id: f.film_id,
          title: f.title,
          source_url: page.final_url,
          bookable_link_count: $(".date-row a.film_book_button[href]").length,
          source_format_tag_count: formatTags.length,
          format_context: formatTags
            .slice(0, 2)
            .map((_, el) =>
              $(el).parent().parent().text().replace(/\s+/g, " ").trim(),
            )
            .get(),
        };
      }),
    )),
  );
}
writeFileSync(
  "docs/evidence/agent-fetch-verification.json",
  JSON.stringify(
    {
      checked_at: new Date().toISOString(),
      agent: result,
      fetch_programme_count: programme.length,
      comparisons,
      note: "Fetch independently verifies each returned title/ID and format-tagged screenings (including sold-out shows); visible UI interaction comes from Agent, not Fetch. Up to 10 cards, not a completeness guarantee.",
    },
    null,
    2,
  ) + "\n",
);
console.log(
  `Verified ${comparisons.length} Agent films against live TinyFish Fetch`,
);

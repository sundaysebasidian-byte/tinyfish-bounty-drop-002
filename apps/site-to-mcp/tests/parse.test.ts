import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  catalogue,
  details,
  performances,
  allowedByRobots,
} from "../src/parse.js";
import { ORIGIN, ToolError } from "../src/schema.js";
const html = readFileSync(
  new URL("./fixtures/film.html", import.meta.url),
  "utf8",
);
test("recorded Fetch film facts and deduplicated mobile/desktop performances", () => {
  const d = details(html, "1808", ORIGIN + "/film/1808/akira/");
  assert.equal(d.title, "Akira");
  assert.equal(d.runtime_minutes, 125);
  const s = performances(html, "1808", d.source_url).screenings;
  assert.equal(s.length, 6);
  assert.equal(s[0].performance_id, "31627780");
  assert.deepEqual(s[0].tags, ["35mm", "SUB"]);
});
test("catalogue yields stable numeric identifiers", () => {
  const rows = catalogue(
    readFileSync(new URL("./fixtures/programme.html", import.meta.url), "utf8"),
  );
  assert.equal(rows.length, 4);
  assert.equal(rows[0].film_id, "30030716");
});
test("markup drift fails loudly instead of empty results", () => {
  assert.throws(
    () => catalogue("<main>Maintenance</main>"),
    (e: unknown) => e instanceof ToolError && e.code === "SITE_CHANGED",
  );
  assert.throws(() =>
    details(html.replace("125mins", "runtime pending"), "1808", ORIGIN),
  );
  assert.throws(() =>
    performances(
      html.replaceAll("film_book_button", "new_button"),
      "1808",
      ORIGIN,
    ),
  );
});
test("cross-origin booking injection is rejected", () => {
  assert.throws(
    () =>
      performances(
        html.replaceAll(ORIGIN, "https://evil.example"),
        "1808",
        ORIGIN,
      ),
    ToolError,
  );
});
test("robots disallow, wildcard and longest allow", () => {
  const r =
    "User-agent: *\nDisallow: /private/\nAllow: /private/public/\nDisallow: /film/*/secret";
  assert.equal(allowedByRobots(r, "/private/a"), false);
  assert.equal(allowedByRobots(r, "/private/public/a"), true);
  assert.equal(allowedByRobots(r, "/film/123/secret"), false);
  assert.equal(allowedByRobots(r, "/film/1808/akira"), true);
  assert.throws(() => allowedByRobots("error", "/film/1808"));
});

test("Fetch markdown literal CRLF robots excludes booking paths", () => {
  assert.equal(
    allowedByRobots(
      "# START\\r\\nUser-agent: *\\r\\nDisallow: /prince-charles-cinema/booknow/\\r\\n",
      "/prince-charles-cinema/booknow/123",
    ),
    false,
  );
});

test("Fetch markdown escaped wildcard still applies robots rules",()=>{assert.equal(allowedByRobots("User-agent: \\*\nDisallow: /prince-charles-cinema/booknow/", "/prince-charles-cinema/booknow/123"),false)});

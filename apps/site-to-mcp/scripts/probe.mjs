import fs from "node:fs";
const key = process.env.TINYFISH_API_KEY;
if (!key) throw Error("Set TINYFISH_API_KEY in the environment");
const urls = process.argv.slice(2);
const r = await fetch("https://api.fetch.tinyfish.ai", {
  method: "POST",
  headers: { "X-API-Key": key, "Content-Type": "application/json" },
  body: JSON.stringify({
    urls,
    format: "html",
    links: true,
    ttl: 0,
    include_selectors: ["body"],
  }),
});
const data = await r.json();
fs.mkdirSync("docs/evidence", { recursive: true });
fs.writeFileSync(
  "docs/evidence/probe-" + Date.now() + ".json",
  JSON.stringify(data, null, 2),
);
console.log(JSON.stringify(data).slice(0, 1800));

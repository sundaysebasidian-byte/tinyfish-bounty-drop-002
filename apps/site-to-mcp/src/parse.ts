import { load } from "cheerio";
import {
  ORIGIN,
  ToolError,
  film,
  filmOutput,
  screeningsOutput,
} from "./schema.js";
const clean = (s: string) => s.replace(/\s+/g, " ").trim();
export function catalogue(html: string) {
  const $ = load(html);
  const films = new Map<string, ReturnType<typeof film.parse>>();
  $(".film_list-outer .liveeventtitle").each((_, el) => {
    const a = $(el),
      url = new URL(a.attr("href") ?? "", ORIGIN);
    const m = url.pathname.match(/^\/film\/(\d+)\//);
    if (url.origin !== ORIGIN || !m)
      throw new ToolError("SITE_CHANGED", "Film link shape changed");
    films.set(
      m[1],
      film.parse({ film_id: m[1], title: clean(a.text()), url: url.href }),
    );
  });
  if (!films.size)
    throw new ToolError(
      "SITE_CHANGED",
      "Missing .film_list-outer .liveeventtitle; programme cannot be trusted",
    );
  return [...films.values()];
}
export function details(html: string, film_id: string, source_url: string) {
  const $ = load(html);
  const info = $(".plot .movie-info")
    .first()
    .find("li")
    .toArray()
    .map((e) => clean($(e).text()));
  return filmOutput.parse({
    film_id,
    source_url,
    checked_at: new Date().toISOString(),
    title: clean($(".plot h2").first().text()),
    year: Number(info[0]),
    runtime_minutes: Number(info[1]?.replace("mins", "")),
    country: info[2],
    certificate: info[3],
    genre: info[4],
    director: clean($(".plot .film-info span").first().text()).replace(
      /^Directed by /,
      "",
    ),
  });
}
export function performances(
  html: string,
  film_id: string,
  source_url: string,
) {
  const $ = load(html);
  const rows = new Map();
  $(".date-row").each((_, el) => {
    const row = $(el);
    row.find("a.film_book_button[href]").each((_, a) => {
      const link = $(a),
        url = new URL(link.attr("href") ?? "", ORIGIN),
        m = url.pathname.match(/^\/prince-charles-cinema\/booknow\/(\d+)\/?$/);
      if (url.origin !== ORIGIN || !m)
        throw new ToolError("SITE_CHANGED", "Booking link changed");
      rows.set(m[1], {
        performance_id: m[1],
        date_label: clean(row.find(".heading").first().text()),
        time: clean(link.find(".time").text()),
        tags: link
          .parent()
          .find(".tag")
          .toArray()
          .map((t) => clean($(t).text())),
        booking_url: url.href,
      });
    });
  });
  return screeningsOutput.parse({
    source_url,
    checked_at: new Date().toISOString(),
    film_id,
    timezone: "Europe/London",
    screenings: [...rows.values()],
  });
}
export function allowedByRobots(text: string, path: string) {
  text = text.replace(/\\r\\n/g, "\n").replace(/\\n/g, "\n");
  if (!/User-agent:/i.test(text))
    throw new ToolError("SITE_CHANGED", "Invalid robots.txt");
  let applies = false;
  const rules: { allow: boolean; path: string }[] = [];
  for (const raw of text.split("\n")) {
    const line = raw.replace(/#.*/, "").trim(),
      m = line.match(/^(User-agent|Disallow|Allow):\s*(.*)$/i);
    if (!m) continue;
    if (m[1].toLowerCase() === "user-agent") {
      applies = m[2] === "*";
      continue;
    }
    if (applies && m[2])
      rules.push({ allow: m[1].toLowerCase() === "allow", path: m[2] });
  }
  const matches = rules
    .filter((r) =>
      new RegExp(
        "^" +
          r.path
            .split("*")
            .map((s) => s.replace(/[.+?^{}()|[\]\\]/g, "\\$&"))
            .join(".*")
            .replace(/\\\$$/, "$"),
      ).test(path),
    )
    .sort(
      (a, b) =>
        b.path.length - a.path.length || Number(b.allow) - Number(a.allow),
    );
  return matches[0]?.allow ?? true;
}

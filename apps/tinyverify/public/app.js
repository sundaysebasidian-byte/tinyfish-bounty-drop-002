const main = document.querySelector("#main"),
  results = document.querySelector("#results");
const el = (tag, text, cls) => {
  const n = document.createElement(tag);
  if (text !== undefined) n.textContent = text;
  if (cls) n.className = cls;
  return n;
};
const wrap = (tag, cls, ...kids) => {
  const n = el(tag, undefined, cls);
  n.append(...kids);
  return n;
};
async function api(path, body) {
  const r = await fetch(
    path,
    body
      ? {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      : undefined,
  );
  const d = await r.json();
  if (!r.ok)
    throw Error(
      r.status === 429 && d.error === "rate_limit"
        ? "Too many requests. Try again in a minute."
        : d.message || d.error,
    );
  return d;
}
function link(text, url, cls) {
  const a = el("a", text, cls);
  a.href = url;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  return a;
}
const host = (url) => {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
};
const when = (iso) => {
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  const p = new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .formatToParts(d)
    .reduce((o, x) => ((o[x.type] = x.value), o), {});
  return `${p.day} ${p.month} ${p.year} · ${p.hour}:${p.minute} UTC`;
};
const time = (iso, cls) => {
  const t = el("time", when(iso), cls);
  t.dateTime = iso;
  t.title = iso;
  return t;
};
const registries = api("/api/registries");
const regInfo = async (id) => {
  try {
    return (await registries).registries.find((r) => r.id === id) ?? { name: id };
  } catch {
    return { name: id };
  }
};

/* status */
const STATUS = new Set([
  "active",
  "inactive",
  "expired",
  "lapsed",
  "suspended",
  "revoked",
  "dissolved",
  "unknown",
]);
const statusOf = (text) => {
  const s = String(text).toLowerCase();
  if (STATUS.has(s)) return s;
  if (/suspend/.test(s)) return "suspended";
  if (/revok|disbar/.test(s)) return "revoked";
  if (/expir|lapse/.test(s)) return "expired";
  if (/inactive|cancel|clos|dissolv|retire/.test(s)) return "inactive";
  if (/active|issued|open|good standing/.test(s)) return "active";
  return "unknown";
};
const badge = (status, label, large) =>
  el(
    "span",
    label ?? status,
    `badge s-${statusOf(status)}${large ? " lg" : ""}`,
  );
const kv = (k, v, cls) => {
  const d = el("div");
  d.append(el("span", k, "k"), v instanceof Node ? v : el("span", v, "v" + (cls ? " " + cls : "")));
  if (v instanceof Node) v.classList.add("v");
  return d;
};
const unsupplied = "Not supplied / not assessed";
const disc = (a) =>
  a === null ? unsupplied : a.join("; ") || "None reported";

/* loading */
const skeleton = (label) => {
  const c = wrap("article", "card loading");
  c.setAttribute("role", "status");
  c.append(
    wrap(
      "div",
      "ch",
      el("span", undefined, "skel w1"),
      el("span", undefined, "skel w2"),
    ),
    wrap(
      "div",
      "status-line",
      el("span", undefined, "pulse"),
      el("span", label),
    ),
    el("div", undefined, "track"),
    wrap(
      "div",
      "cand",
      el("span", undefined, "skel"),
      wrap("div", undefined, el("span", undefined, "skel w3"), el("span", undefined, "skel w4")),
    ),
  );
  return c;
};

/* result cards */
const OUTCOME = {
  match: "Match",
  multiple_matches: "Multiple matches",
  no_match: "No match",
  registry_error: "Registry error",
  agent_required: "Agent required",
  pending: "Agent running",
};
function candidate(record, r, params, card) {
  const row = el("div", undefined, "cand"),
    text = el("div"),
    sub = el("div", undefined, "sub");
  sub.append(el("span", record.record_number, "num"));
  if (record.name_match)
    sub.append(
      el(
        "span",
        record.name_match === "exact_or_variant"
          ? "Exact or variant"
          : "Possible match",
      ),
    );
  const facts = el("div", undefined, "facts");
  if (statusOf(record.source_status) !== record.status || record.source_status.toLowerCase() !== (record.status_label ?? record.status).toLowerCase())
    facts.append(kv("Source status", record.source_status));
  if (record.expiry_date) facts.append(kv("Expiry / renewal", record.expiry_date));
  if (record.disciplinary_actions !== null)
    facts.append(kv("Disciplinary actions", disc(record.disciplinary_actions)));
  text.append(el("div", record.name, "name"), sub);
  if (facts.childNodes.length) text.append(facts);
  if (record.flags?.length) text.append(el("p", record.flags.join(", "), "flags"));
  const act = el("div", undefined, "act");
  if (record.receiptable) {
    const choose = el("button", "View receipt", "ghost");
    choose.onclick = async () => {
      choose.disabled = true;
      try {
        const receipt = await api("/api/receipts", {
          registry: r.registry,
          record_number: record.record_number,
        });
        location.href = "/r/" + receipt.id;
      } catch (e) {
        error(card, e);
        choose.disabled = false;
      }
    };
    act.append(choose);
  } else act.append(link("Official record ↗", record.source_link));
  row.append(badge(record.status, record.status_label), text, act);
  return row;
}
async function renderResult(r, params) {
  const info = await regInfo(r.registry);
  const card = el("article", undefined, "card");
  const title = el("div");
  title.append(el("h2", info.name));
  if (info.authority) title.append(el("p", info.authority, "auth"));
  card.append(
    wrap("div", "ch", title, el("span", OUTCOME[r.outcome] ?? r.outcome, "outcome o-" + r.outcome)),
  );
  if (r.checked_at && r.source_url) {
    const src = link(host(r.source_url) + " ↗", r.source_url);
    const checked = wrap("span", undefined, time(r.checked_at));
    if (r.cached) checked.append(" · Cached");
    card.append(wrap("div", "prov", kv("Source", src), kv("Checked", checked)));
  }
  if (r.message && r.outcome !== "agent_required")
    card.append(
      el("p", r.message, "note " + (r.outcome === "registry_error" ? "error" : "quiet")),
    );
  if (r.truncated)
    card.append(
      el(
        "p",
        "Results may be incomplete. Narrow the name or use a record number.",
        "note warning",
      ),
    );
  if (r.outcome === "agent_required") {
    const run = el("button", "Run Agent check", "primary");
    const box = el("div", undefined, "agent-run");
    box.append(run);
    run.onclick = () => runAgent(card, r, params, run);
    card.append(box);
  }
  for (const record of r.candidates ?? []) card.append(candidate(record, r, params, card));
  return card;
}
async function runAgent(card, r, params, run) {
  run.disabled = true;
  const name = params.get("name");
  const started = Date.now();
  const clock = el("time", "0:00");
  const status = wrap(
    "div",
    "status-line",
    el("span", undefined, "pulse"),
    el("span", "Agent check running"),
    clock,
  );
  const box = card.querySelector(".agent-run");
  const ticker = setInterval(() => {
    const s = Math.floor((Date.now() - started) / 1000);
    clock.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  }, 1000);
  const loader = wrap("div", "loading", status, el("div", undefined, "track"));
  loader.setAttribute("role", "status");
  box.replaceChildren(loader);
  box.classList.add("busy");
  const chip = card.querySelector(".outcome");
  chip.textContent = OUTCOME.pending;
  chip.className = "outcome o-pending";
  try {
    let data = await api("/api/deep-check", { name });
    while (data.outcome === "pending") {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      data = await api(`/api/deep-check/${data.run_id}`);
    }
    const done = await renderResult(
      {
        registry: r.registry,
        outcome: data.outcome,
        cached: data.cached,
        checked_at: data.checked_at,
        source_url: data.source_url,
        message: data.message,
        candidates: (data.candidates ?? []).map((c) => ({
          ...c,
          status: statusOf(c.source_status),
          status_label: c.source_status,
        })),
      },
      params,
    );
    card.replaceWith(done);
  } catch (e) {
    box.replaceChildren(run);
    box.classList.remove("busy");
    chip.textContent = OUTCOME.agent_required;
    chip.className = "outcome o-agent_required";
    run.disabled = false;
    error(card, e);
  } finally {
    clearInterval(ticker);
  }
}
function error(where, e) {
  const old = where.querySelector(":scope > .note.error.js");
  if (old) old.remove();
  where.append(el("p", e.message, "note error js"));
}

/* pages */
async function showReceipt(id) {
  main.replaceChildren(
    wrap(
      "div",
      "hero",
      el("span", undefined, "skel w2"),
      el("span", undefined, "skel w1"),
    ),
  );
  try {
    const r = await api("/api/receipts/" + id);
    document.title = r.record.name + " · TinyVerify";
    const rec = r.record;
    const hero = wrap(
      "div",
      "hero",
      el("p", r.authority, "eyebrow"),
      badge(rec.status, undefined, true),
      el("h1", rec.name),
      el("p", rec.record_number, "num"),
    );
    const source = wrap(
      "div",
      "panel",
      wrap(
        "div",
        "prov",
        kv("Source", link(host(rec.source_link) + " ↗", rec.source_link)),
        kv("Checked at", time(r.checked_at)),
      ),
      wrap(
        "div",
        "src",
        el("span", r.source_url, "url"),
        link("Open official record ↗", rec.source_link, "btn primary"),
      ),
    );
    const row = (dl, k, v, cls) => {
      const dd = el("dd", v, cls);
      dl.append(el("dt", k), dd);
    };
    const facts = el("dl");
    row(facts, "Registration number", rec.record_number, "mono");
    row(facts, "Source status", rec.source_status);
    row(
      facts,
      "Expiry / next renewal",
      rec.expiry_date ?? "Not supplied by this source",
      rec.expiry_date ? "" : "unk",
    );
    row(
      facts,
      "Disciplinary actions",
      disc(rec.disciplinary_actions),
      rec.disciplinary_actions === null ? "unk" : "",
    );
    row(facts, "Flags", rec.flags.join(", ") || "None reported");
    row(
      facts,
      "Name variants",
      rec.name_variants.join("; ") || "Not supplied",
      rec.name_variants.length ? "" : "unk",
    );
    const hashes = el("dl");
    row(hashes, "Response SHA-256", r.sha256, "mono");
    row(hashes, "Record SHA-256", r.fields_sha256, "mono");
    main.replaceChildren(
      hero,
      source,
      wrap("div", "panel", facts),
      wrap("div", "panel", hashes),
    );
    if (rec.notes.length)
      main.append(wrap("div", "notes", ...rec.notes.map((n) => el("p", n))));
    const actions = el("div", undefined, "actions");
    const msg = el("p", undefined, "msg");
    msg.setAttribute("role", "status");
    const recheck = el("button", "Re-check live", "primary");
    recheck.onclick = async () => {
      recheck.disabled = true;
      recheck.textContent = "Checking…";
      msg.textContent = "";
      try {
        const next = await api("/api/receipts/" + id + "/recheck", {});
        if (next.id) location.href = "/r/" + next.id;
        else {
          msg.textContent =
            "Registry returned no matching record. Previous evidence is retained.";
          recheck.disabled = false;
          recheck.textContent = "Re-check live";
        }
      } catch (e) {
        msg.textContent = e.message;
        recheck.disabled = false;
        recheck.textContent = "Re-check live";
      }
    };
    const copy = el("button", "Copy receipt link", "ghost");
    copy.onclick = async () => {
      await navigator.clipboard.writeText(location.href);
      copy.textContent = "Copied";
      setTimeout(() => (copy.textContent = "Copy receipt link"), 2000);
    };
    const download = link("Download JSON", "/api/receipts/" + id, "btn");
    download.removeAttribute("target");
    download.download = "tinyverify-" + id + ".json";
    actions.append(recheck, copy, download, msg);
    const details = el("details");
    details.append(
      el("summary", "Reusable JSON"),
      el("pre", JSON.stringify(r, null, 2)),
    );
    main.append(actions, details);
  } catch (e) {
    main.replaceChildren();
    error(main, e);
  }
}
function showCoverage() {
  document.querySelector("nav a[href='/registries']")?.setAttribute("aria-current", "page");
  main.replaceChildren(el("h1", "Registry coverage"));
  registries
    .then((d) => {
      const table = el("table"),
        head = el("tr");
      for (const title of ["Registry / authority", "Jurisdiction", "Record type", "Access"])
        head.append(el("th", title));
      table.appendChild(el("thead")).append(head);
      const body = table.appendChild(el("tbody"));
      for (const r of d.registries) {
        const row = el("tr"),
          first = el("td", r.name);
        first.append(el("small", r.authority));
        const access = el("td");
        access.append(
          el("span", r.method, "chip" + (r.method === "Agent" ? " agent" : "")),
        );
        if (r.method === "Agent") access.append(el("small", "Capped public access"));
        row.append(
          first,
          el("td", r.jurisdiction),
          el("td", r.type),
          access,
        );
        body.append(row);
      }
      main.append(wrap("div", "table-wrap", table));
      if (d.unsupported.length)
        main.append(
          wrap(
            "div",
            "unsup",
            ...d.unsupported.map((r) => {
              const p = el("p");
              p.append(el("b", r.id.toUpperCase()), " · " + r.reason);
              return p;
            }),
          ),
        );
    })
    .catch((e) => error(main, e));
}
function showSearch() {
  const form = document.querySelector("#search");
  document.querySelectorAll("[data-example]").forEach(
    (b) =>
      (b.onclick = () => {
        form.elements.name.value = b.dataset.example;
        form.requestSubmit();
      }),
  );
  registries
    .then((d) => {
      const select = form.elements.registry;
      for (const r of d.registries) {
        const option = el("option", r.name);
        option.value = r.id;
        select.append(option);
      }
      select.onchange = () => {
        const r = d.registries.find((r) => r.id === select.value);
        if (r) {
          form.elements.record_type.value = r.type;
          form.elements.jurisdiction.value = r.jurisdiction;
        }
      };
    })
    .catch((e) => error(results, e));
  form.onsubmit = async (e) => {
    e.preventDefault();
    const submit = form.querySelector("[type=submit]");
    submit.disabled = true;
    submit.setAttribute("aria-busy", "true");
    results.setAttribute("aria-busy", "true");
    results.replaceChildren(skeleton("Checking live official sources…"));
    try {
      const params = new URLSearchParams(new FormData(form));
      if (!params.get("registry")) params.delete("registry");
      const d = await api("/api/verify?" + params);
      const cards = [];
      if (!d.results.length) {
        const note = el("p", undefined, "note quiet");
        note.append(
          d.message ?? "No supported registry for this combination. See ",
        );
        if (!d.message) note.append(el("a", "Coverage"), ".");
        if (!d.message) note.querySelector("a").href = "/registries";
        cards.push(wrap("article", "card solo", note));
      }
      for (const r of d.results) {
        r.candidates = r.candidates.map((c) => ({ ...c, receiptable: true }));
        cards.push(await renderResult(r, params));
      }
      results.replaceChildren(...cards);
    } catch (e) {
      results.replaceChildren();
      const c = el("article", undefined, "card solo");
      error(c, e);
      results.append(c);
    } finally {
      submit.disabled = false;
      submit.removeAttribute("aria-busy");
      results.setAttribute("aria-busy", "false");
    }
  };
}
if (location.pathname.startsWith("/r/"))
  showReceipt(location.pathname.split("/")[2]);
else if (location.pathname === "/registries") showCoverage();
else showSearch();

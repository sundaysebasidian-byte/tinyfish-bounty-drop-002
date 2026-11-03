const main = document.querySelector("#main"),
  results = document.querySelector("#results");
const el = (tag, text, cls) => {
  const n = document.createElement(tag);
  if (text !== undefined) n.textContent = text;
  if (cls) n.className = cls;
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
  if (!r.ok) throw Error(d.message || d.error);
  return d;
}
function link(text, url) {
  const a = el("a", text);
  a.href = url;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  return a;
}
function error(where, e) {
  where.append(el("p", e.message, "warning"));
}
async function showReceipt(id) {
  main.replaceChildren(el("p", "Loading receipt…"));
  try {
    const r = await api("/api/receipts/" + id);
    main.replaceChildren(
      el("p", r.authority, "eyebrow"),
      el("h1", r.record.status),
      el("h2", r.record.name),
    );
    const dl = el("dl");
    for (const [label, value] of Object.entries({
      "Registration number": r.record.record_number,
      "Source status": r.record.source_status,
      "Expiry / next renewal":
        r.record.expiry_date ?? "Not supplied by this source",
      "Disciplinary actions":
        r.record.disciplinary_actions === null
          ? "Not supplied / not assessed"
          : r.record.disciplinary_actions.join("; ") || "None reported",
      Flags: r.record.flags.join(", ") || "None reported",
      "Name variants": r.record.name_variants.join("; ") || "Not supplied",
      "Checked at": r.checked_at,
      "Response SHA-256": r.sha256,
      "Record SHA-256": r.fields_sha256,
    })) {
      dl.append(el("dt", label), el("dd", value));
    }
    main.append(
      dl,
      link("Open official record ↗", r.record.source_link),
      el("p", r.source_url, "muted"),
    );
    for (const note of r.record.notes) main.append(el("p", note, "muted"));
    const actions = el("div", undefined, "actions");
    const recheck = el("button", "Re-check live");
    recheck.onclick = async () => {
      recheck.disabled = true;
      try {
        const next = await api("/api/receipts/" + id + "/recheck", {});
        if (next.id) location.href = "/r/" + next.id;
        else
          main.append(
            el(
              "p",
              "Registry returned no matching record. Previous evidence is retained.",
            ),
          );
      } catch (e) {
        error(main, e);
        recheck.disabled = false;
      }
    };
    const download = link("Download JSON", "/api/receipts/" + id);
    download.download = "tinyverify-" + id + ".json";
    const copy = el("button", "Copy receipt link");
    copy.onclick = async () => {
      await navigator.clipboard.writeText(location.href);
      copy.textContent = "Copied";
    };
    actions.append(recheck, copy, download);
    main.append(actions);
    const details = el("details");
    details.append(
      el("summary", "Reusable JSON"),
      el("pre", JSON.stringify(r, null, 2)),
    );
    main.append(details);
  } catch (e) {
    main.replaceChildren();
    error(main, e);
  }
}
if (location.pathname.startsWith("/r/"))
  showReceipt(location.pathname.split("/")[2]);
else if (location.pathname === "/registries") {
  main.replaceChildren(el("h1", "Registry coverage"));
  api("/api/registries")
    .then((d) => {
      const table = el("table"),
        head = el("tr");
      for (const title of [
        "Registry / authority",
        "Jurisdiction",
        "Record type",
        "Access",
      ])
        head.append(el("th", title));
      table.append(head);
      for (const r of d.registries) {
        const row = el("tr");
        for (const value of [
          r.name + " · " + r.authority,
          r.jurisdiction,
          r.type,
          r.method + (r.method === "Agent" ? " · admin only" : ""),
        ])
          row.append(el("td", value));
        table.append(row);
      }
      main.append(table);
      for (const r of d.unsupported)
        main.append(el("p", r.id.toUpperCase() + ": " + r.reason, "muted"));
    })
    .catch((e) => error(main, e));
} else {
  const form = document.querySelector("#search");
  document.querySelectorAll("[data-example]").forEach(
    (b) =>
      (b.onclick = () => {
        form.elements.name.value = b.dataset.example;
        form.requestSubmit();
      }),
  );
  form.onsubmit = async (e) => {
    e.preventDefault();
    results.replaceChildren(el("p", "Checking live official sources…"));
    const submit = form.querySelector("[type=submit]");
    submit.disabled = true;
    try {
      const d = await api(
        "/api/verify?" + new URLSearchParams(new FormData(form)),
      );
      results.replaceChildren();
      if (!d.results.length)
        results.append(
          el("p", "No supported registry for this combination. See Coverage."),
        );
      for (const r of d.results) {
        const card = el("article", undefined, "card");
        card.append(
          el("h2", r.registry),
          el("p", r.outcome.replaceAll("_", " "), "muted"),
        );
        if (r.message) card.append(el("p", r.message, "warning"));
        if (r.truncated)
          card.append(
            el(
              "p",
              "Results may be incomplete. Narrow the name or use a record number.",
              "warning",
            ),
          );
        for (const record of r.candidates) {
          const row = el("div", undefined, "row"),
            text = el("div");
          text.append(
            el("strong", record.name),
            el(
              "p",
              record.record_number +
                " · " +
                record.name_match.replaceAll("_", " "),
              "muted",
            ),
          );
          const badge = el("span", record.status, "pill " + record.status);
          text.append(badge);
          if (record.flags.length)
            text.append(el("p", record.flags.join(", "), "warning"));
          const choose = el("button", "View receipt");
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
          row.append(text, choose);
          card.append(row);
        }
        results.append(card);
      }
    } catch (e) {
      results.replaceChildren();
      error(results, e);
    } finally {
      submit.disabled = false;
    }
  };
}

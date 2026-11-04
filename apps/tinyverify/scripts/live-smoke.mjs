import { writeFile, appendFile } from "node:fs/promises";
const base = process.env.BASE_URL;
if (!base) throw Error("BASE_URL required");
const evidence = [];
async function call(path, body, auth = false) {
  const r = await fetch(base + path, {
    method: body ? "POST" : "GET",
    headers: {
      "Content-Type": "application/json",
      ...(auth ? { Authorization: `Bearer ${process.env.ADMIN_TOKEN}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const d = await r.json();
  evidence.push({ path, status: r.status, data: d });
  return { status: r.status, data: d };
}
for (const [registry, name] of [
  ["companies", "00445790"],
  ["gleif", "HWUPKR0MPOU8FGXBT394"],
  ["fdic", "628"],
  ["abn", "51824753556"],
  ["charity", "202918"],
  ["finra", "robinhood"],
  ["npi", "Mayo Clinic"],
]) {
  const r = await call(
    "/api/verify?" +
      new URLSearchParams({
        name,
        registry,
        record_type: "any",
        jurisdiction: "Global",
      }),
  );
  console.log(
    registry,
    r.status,
    r.data.results?.[0]?.outcome,
    r.data.results?.[0]?.candidates?.length,
  );
}
const receipt = await call("/api/receipts", {
  registry: "companies",
  record_number: "00445790",
});
console.log("receipt", receipt.status, receipt.data.id);
if (receipt.data.id) {
  await call("/api/receipts/" + receipt.data.id);
  await call("/api/receipts/" + receipt.data.id + "/recheck", {});
  if (process.env.CREATE_WATCH === "true") {
    const watch = await call(
      "/api/watches",
      { receipt_id: receipt.data.id },
      true,
    );
    console.log("watch", watch.status, watch.data.id);
  }
}
await call("/api/discover?name=TESCO%20PLC&registry=companies");
if (process.env.RUN_AGENT === "true") {
  const r = await call(
    "/api/deep-check",
    { name: "Turner Construction Company" },
    true,
  );
  console.log("agent", r.status, JSON.stringify(r.data).slice(0, 300));
}
const costs = await call("/api/admin/costs", undefined, true);
for (const row of costs.data.results ?? [])
  await appendFile(".cost-log.jsonl", JSON.stringify(row) + "\n");
await writeFile(
  "live-evidence.json",
  JSON.stringify({ at: new Date().toISOString(), base, evidence }, null, 2),
);

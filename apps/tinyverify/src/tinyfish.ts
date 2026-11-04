import { officialURL, type RegistryId } from "./registries";
export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  TINYFISH_API_KEY: string;
  ADMIN_TOKEN: string;
  PAID_CALLS_ENABLED: string;
  PUBLIC_BASE_URL: string;
}
export interface FetchPage {
  url: string;
  final_url?: string;
  text: string;
}
export async function tinyfish(env: Env, path: string, body?: unknown) {
  const r = await fetch(path, {
    method: body ? "POST" : "GET",
    headers: {
      "X-API-Key": env.TINYFISH_API_KEY,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(150000),
  });
  if (!r.ok) throw Error(`TinyFish HTTP ${r.status}`);
  return r.json() as Promise<unknown>;
}
export async function fetchOfficial(
  env: Env,
  id: RegistryId,
  url: string,
  fresh = false,
) {
  officialURL(id, url);
  const data = (await tinyfish(env, "https://api.fetch.tinyfish.ai", {
    urls: [url],
    format: "markdown",
    ttl: fresh ? 0 : 3600,
  })) as { results?: FetchPage[]; errors?: unknown[] };
  if (data.errors?.length || !data.results?.[0]?.text)
    throw Error("Registry retrieval failed");
  const page = data.results[0];
  officialURL(id, page.final_url ?? page.url);
  return page.text;
}
export async function reserve(
  env: Env,
  primitive: "agent" | "monitor",
  usd: number,
  publicIP?: string,
) {
  if (env.PAID_CALLS_ENABLED !== "true") throw Error("Paid calls disabled");
  const wallet = (await tinyfish(
    env,
    "https://agent.tinyfish.ai/v1/wallet",
  )) as { available_balance: string };
  if (
    !Number.isFinite(Number(wallet.available_balance)) ||
    Number(wallet.available_balance) - usd < 3
  )
    throw Error("Wallet floor $3");
  const day = new Date().toISOString().slice(0, 10);
  const id = crypto.randomUUID();
  const r = await env.DB.prepare(
    `INSERT INTO costs(id,primitive,usd,day,created_at,reserved_usd,public_ip) SELECT ?,?,?,?,?,?,? WHERE (SELECT COALESCE(SUM(usd),0) FROM costs)+? < 2.4 AND (SELECT COALESCE(SUM(usd),0) FROM costs WHERE day=? AND primitive=?)+? <= ? AND (? IS NULL OR ((SELECT COUNT(*) FROM costs WHERE day=? AND public_ip IS NOT NULL)<3 AND (SELECT COUNT(*) FROM costs WHERE day=? AND public_ip=?)<1)) AND NOT EXISTS(SELECT 1 FROM costs WHERE over_step_budget=1)`,
  )
    .bind(
      id,
      primitive,
      usd,
      day,
      new Date().toISOString(),
      usd,
      publicIP ?? null,
      usd,
      day,
      primitive,
      usd,
      primitive === "agent" ? 0.6 : 0.2,
      publicIP ?? null, day, day, publicIP ?? null,
    )
    .run();
  if (!r.meta.changes) throw Error("Budget stop: 80% of $3 cap or daily cap");
  return id;
}
export const sha256 = async (text: string) =>
  Array.from(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)),
    ),
    (b) => b.toString(16).padStart(2, "0"),
  ).join("");

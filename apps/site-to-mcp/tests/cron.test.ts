import { test } from "node:test";
import assert from "node:assert/strict";
import worker from "../src/worker.js";
import { Runtime } from "../src/runtime.js";
test("scheduled Worker runs health and persists the same per-tool failure report", async () => {
  const original = Runtime.prototype.health;
  const report = {
    checked_at: new Date().toISOString(),
    ok: false,
    tools: [
      {
        tool: "filter_programme",
        ok: false,
        code: "SITE_CHANGED",
        reason: "Filter panel missing",
        duration_ms: 1,
      },
    ],
  };
  let stored = false;
  const pending: Promise<unknown>[] = [];
  const statement = {
    bind(...values: unknown[]) {
      if (values.includes("last-health")) {
        assert.deepEqual(JSON.parse(String(values[1])), report);
        stored = true;
      }
      return this;
    },
    async run() {
      return {};
    },
  };
  Runtime.prototype.health = async () => report;
  try {
    const env = {
      DB: {
        prepare() {
          return statement;
        },
      },
      TINYFISH_API_KEY: "test-key",
      PAID_CALLS_ENABLED: "false",
    };
    await worker.scheduled(
      {} as ScheduledController,
      env as unknown as Env,
      {
        waitUntil(p: Promise<unknown>) {
          pending.push(p);
        },
      } as ExecutionContext,
    );
    await Promise.all(pending);
    assert.equal(stored, true);
  } finally {
    Runtime.prototype.health = original;
  }
});

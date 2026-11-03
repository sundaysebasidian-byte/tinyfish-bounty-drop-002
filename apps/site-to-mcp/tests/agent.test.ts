import { test } from "node:test";
import assert from "node:assert/strict";
import { TinyFish } from "../src/tinyfish.js";
import { Runtime } from "../src/runtime.js";
import { LocalState } from "../src/local-state.js";
import { ToolError } from "../src/schema.js";

test("Agent request uses the accepted duration bound", async () => {
  const tf = new TinyFish("test-key");
  let body: Record<string, unknown> | undefined;
  tf.request = async (_url, input) => {
    body = input as Record<string, unknown>;
    return {
      run_id: "test",
      status: "COMPLETED",
      num_of_steps: 10,
      result: {},
    };
  };
  await tf.agent("https://princecharlescinema.com/whats-on/", "35mm");
  assert.deepEqual(body?.agent_config, { max_duration_seconds: 90 });
});

test("Agent settles reported steps, caches six hours and preserves paid guard", async () => {
  const state = new LocalState(":memory:");
  const env = {
    DB: state,
    TINYFISH_API_KEY: "test-key",
    PAID_CALLS_ENABLED: "true",
  };
  const runtime = new Runtime(env);
  runtime.tf.page = async () => ({ url: "", final_url: "", text: "" });
  let calls = 0;
  runtime.tf.agent = async (_url, modifier) => {
    calls++;
    return {
      run_id: "test",
      status: "COMPLETED",
      num_of_steps: 21,
      result: {
        modifier,
        filter_applied: true,
        empty_state_message: "",
        films: [
          {
            film_id: "1808",
            title: "Akira",
            url: "https://princecharlescinema.com/film/1808/akira/",
          },
        ],
        result_state: "matches",
        interaction: "Selected 35mm and clicked Apply",
      },
    };
  };
  try {
    assert.equal((await runtime.filter("35mm")).cached, false);
    assert.equal(
      (
        await state
          .prepare("SELECT actual_mills FROM costs")
          .first<{ actual_mills: number }>()
      )?.actual_mills,
      336,
    );
    assert.equal(
      (
        await state
          .prepare("SELECT reserved_mills FROM budget")
          .first<{ reserved_mills: number }>()
      )?.reserved_mills,
      336,
    );
    const row = await state
      .prepare("SELECT expires FROM cache")
      .first<{ expires: number }>();
    assert.ok(row && Math.abs(row.expires - Date.now() - 21600000) < 1000);
    assert.equal((await runtime.filter("35mm")).cached, true);
    assert.equal(calls, 1);
    await assert.rejects(
      runtime.filter("70mm"),
      (e: unknown) =>
        e instanceof ToolError && e.code === "BUDGET_OR_RATE_LIMIT",
    );
    env.PAID_CALLS_ENABLED = "false";
    await assert.rejects(
      runtime.filter("70mm"),
      (e: unknown) => e instanceof ToolError && e.code === "PAID_DISABLED",
    );
  } finally {
    state.db.close();
  }
});

test("uncertain filter application is rejected rather than accepted as no matches", async () => {
  const { filterData } = await import("../src/schema.js");
  assert.equal(
    filterData.safeParse({
      modifier: "35mm",
      filter_applied: false,
      empty_state_message: "",
      films: [],
      result_state: "no_matches",
      interaction: "Could not find Apply",
    }).success,
    false,
  );
});

test("gateway timeout recovers the original run without another paid request", async () => {
  const tf = new TinyFish("test-key");
  let paid = 0;
  let goal = "";
  tf.request = async (url, input) => {
    if (input) {
      paid++;
      goal = (input as { goal: string }).goal;
      throw new ToolError("TINYFISH_HTTP", "TinyFish returned HTTP 524");
    }
    assert.ok(url.startsWith("https://agent.tinyfish.ai/v1/runs?"));
    return {
      data: [
        {
          goal: `Navigate to the page: ${goal}`,
          run_id: "original",
          status: "COMPLETED",
          num_of_steps: 8,
          result: {},
        },
      ],
    };
  };
  assert.equal(
    (await tf.agent("https://princecharlescinema.com/whats-on/", "35mm"))
      .run_id,
    "original",
  );
  assert.equal(paid, 1);
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { LocalState } from "../src/local-state.js";
test("persistent SQL guard cannot reserve beyond $1.60 or within cooldown", async () => {
  const state = new LocalState(":memory:");
  const sql =
    "UPDATE budget SET reserved_mills=reserved_mills+320,last_call=? WHERE id=1 AND reserved_mills+320<=1600 AND last_call<? RETURNING id";
  let time = 1000000;
  for (let i = 0; i < 5; i++) {
    assert.ok(
      await state
        .prepare(sql)
        .bind(time, time - 600000)
        .first(),
    );
    assert.equal(
      await state
        .prepare(sql)
        .bind(time + 1, time - 599999)
        .first(),
      null,
    );
    time += 600001;
  }
  assert.equal(
    await state
      .prepare(sql)
      .bind(time, time - 600000)
      .first(),
    null,
  );
  assert.equal(
    (
      await state
        .prepare("SELECT reserved_mills FROM budget")
        .first<{ reserved_mills: number }>()
    )?.reserved_mills,
    1600,
  );
  state.db.close();
});

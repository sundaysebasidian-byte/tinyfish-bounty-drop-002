import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import { appendFileSync, readFileSync } from "node:fs";
import type { State, Statement } from "./state.js";
export class LocalState implements State {
  db: DatabaseSync;
  constructor(path: string) {
    this.db = new DatabaseSync(path);
    this.db.exec(
      readFileSync(new URL("../schema.sql", import.meta.url), "utf8"),
    );
  }
  prepare(sql: string): Statement {
    const db = this.db;
    let values: SQLInputValue[] = [];
    return {
      bind(...v) {
        values = v;
        return this;
      },
      async first<T>() {
        return (db.prepare(sql).get(...values) ?? null) as T | null;
      },
      async run() {
        const result = db.prepare(sql).run(...values);
        if (/^(INSERT INTO costs|UPDATE costs)/.test(sql)) {
          for (const row of db
            .prepare("SELECT * FROM costs ORDER BY at DESC LIMIT 1")
            .all())
            appendFileSync(".cost-log.jsonl", JSON.stringify(row) + "\n");
        }
        return result;
      },
    };
  }
  async batch(statements: Statement[]) {
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const results = [];
      for (const s of statements) results.push(await s.run());
      this.db.exec("COMMIT");
      return results;
    } catch (e) {
      this.db.exec("ROLLBACK");
      throw e;
    }
  }
}

export interface Statement {
  bind(...values: (string | number | null)[]): Statement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  run(): Promise<unknown>;
}
export interface State {
  prepare(sql: string): Statement;
  batch(statements: Statement[]): Promise<unknown>;
}
export interface RuntimeEnv {
  DB: State;
  TINYFISH_API_KEY: string;
  PAID_CALLS_ENABLED: string;
}

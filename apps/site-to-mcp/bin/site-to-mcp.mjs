#!/usr/bin/env node
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
const child = spawn(
  process.execPath,
  [
    "--import",
    "tsx",
    fileURLToPath(new URL("../src/stdio.ts", import.meta.url)),
  ],
  {
    stdio: "inherit",
    env: process.env,
    cwd: fileURLToPath(new URL("..", import.meta.url)),
  },
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => child.kill(signal));
child.on("exit", (code) => process.exit(code ?? 1));

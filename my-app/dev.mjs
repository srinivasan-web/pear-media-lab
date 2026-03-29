import { spawn } from "node:child_process";

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const children = [];

const start = (scriptName) => {
  const child = spawn(npmCommand, ["run", scriptName], {
    stdio: "inherit",
    cwd: process.cwd(),
  });

  children.push(child);
  child.on("exit", (code) => {
    if (code && code !== 0) {
      process.exitCode = code;
    }
  });
};

const shutdown = () => {
  for (const child of children) {
    child.kill("SIGTERM");
  }
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

start("dev:server");
start("dev:client");

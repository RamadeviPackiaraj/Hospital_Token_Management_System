import { existsSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const projectRoot = resolve(process.cwd());
const nextDir = resolve(projectRoot, ".next");

if (nextDir !== resolve(projectRoot, ".next")) {
  throw new Error("Resolved unexpected .next directory path.");
}

if (existsSync(nextDir)) {
  rmSync(nextDir, { recursive: true, force: true });
  console.log("Removed stale .next directory.");
} else {
  console.log(".next directory is already clean.");
}

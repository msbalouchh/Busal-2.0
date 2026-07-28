import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const setupVerifyArg = "./scripts/setup-verify.mjs";

const steps = [
  {
    name: "verify-business-context",
    command: "npx",
    args: ["tsx", "scripts/verify-business-context.ts"],
  },
  {
    name: "verify-authorization",
    command: "npx",
    args: ["tsx", "--import", setupVerifyArg, "scripts/verify-authorization.ts"],
  },
  {
    name: "verify-integration-sprint",
    command: "npx",
    args: ["tsx", "--import", setupVerifyArg, "scripts/verify-integration-sprint.ts"],
  },
];

let failed = false;

for (const step of steps) {
  console.log(`\n=== ${step.name} ===`);

  const result = spawnSync(step.command, step.args, {
    cwd: root,
    stdio: "inherit",
    shell: true,
    env: process.env,
  });

  if (result.status !== 0) {
    failed = true;
    console.error(`\nFAILED: ${step.name}`);
    break;
  }

  console.log(`PASSED: ${step.name}`);
}

if (failed) {
  process.exit(1);
}

console.log("\nAll verification suites passed.");

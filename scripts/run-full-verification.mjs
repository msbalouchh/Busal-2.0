import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const setupVerifyArg = "./scripts/setup-verify.mjs";

const scriptsDir = join(root, "scripts");
const verifyScripts = readdirSync(scriptsDir)
  .filter((name) => name.startsWith("verify-") && name.endsWith(".ts"))
  .sort();

const skipBootstrap = new Set(["verify-dashboard-foundation.ts", "verify-production-deployment.ts"]);

const results = {
  passed: [],
  failed: [],
  environment: [],
};

console.log(`Running ${verifyScripts.length} verification scripts...\n`);

for (const script of verifyScripts) {
  const name = script.replace(/\.ts$/, "");
  console.log(`\n=== ${name} ===`);

  const args = ["tsx"];
  if (!skipBootstrap.has(script)) {
    args.push("--import", setupVerifyArg);
  }
  args.push(join("scripts", script));

  const result = spawnSync("npx", args, {
    cwd: root,
    stdio: "inherit",
    shell: true,
    env: process.env,
  });

  if (result.status === 0) {
    results.passed.push(name);
    console.log(`PASSED: ${name}`);
  } else if (result.status === 2) {
    results.environment.push(name);
    console.error(`ENVIRONMENT: ${name}`);
  } else {
    results.failed.push(name);
    console.error(`FAILED: ${name}`);
  }
}

console.log("\n=== Verification Summary ===");
console.log(`Passed: ${results.passed.length}`);
console.log(`Failed: ${results.failed.length}`);
console.log(`Environment: ${results.environment.length}`);

if (results.failed.length > 0) {
  console.log("\nFailed scripts:");
  for (const name of results.failed) {
    console.log(`  - ${name}`);
  }
}

if (results.environment.length > 0) {
  console.log("\nEnvironment issues:");
  for (const name of results.environment) {
    console.log(`  - ${name}`);
  }
}

if (results.failed.length > 0) {
  process.exit(1);
}

if (results.environment.length > 0 && results.passed.length === 0) {
  process.exit(2);
}

console.log("\nAll application verification scripts passed.");

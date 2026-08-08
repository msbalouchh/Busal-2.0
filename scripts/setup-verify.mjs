import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import Module from "node:module";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnvFile(filename) {
  const path = join(root, filename);

  if (!existsSync(path)) {
    return;
  }

  const content = readFileSync(path, "utf8");

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(".env");
loadEnvFile(".env.local");
loadEnvFile(".env.development");

process.env.ALLOW_MOCK_AI = process.env.ALLOW_MOCK_AI ?? "true";
if (process.env.NODE_ENV === "production") {
  process.env.NODE_ENV = "development";
}

const { bootstrapVerificationEnvironment, ensureOnboardedBusinessForVerification } = await import(
  "./lib/verify-bootstrap.ts"
);
const { getVerifyPrisma } = await import("./lib/verify-prisma.ts");
const { connectWithRetry } = await import("./lib/verify-db.ts");

bootstrapVerificationEnvironment();

const verifyPrisma = getVerifyPrisma();
await connectWithRetry(verifyPrisma);
await ensureOnboardedBusinessForVerification(verifyPrisma);

const originalLoad = Module._load;

Module._load = function (request, parent, isMain) {
  if (request === "server-only") {
    return {};
  }

  if (request === "next/headers") {
    return {
      cookies: async () => ({
        get: () => undefined,
        set: () => undefined,
        delete: () => undefined,
      }),
    };
  }

  if (request === "next/navigation") {
    return {
      redirect: (url) => {
        throw new Error(`NEXT_REDIRECT:${String(url)}`);
      },
    };
  }

  if (request === "next/cache") {
    return {
      revalidatePath: () => undefined,
    };
  }

  return originalLoad.call(this, request, parent, isMain);
};

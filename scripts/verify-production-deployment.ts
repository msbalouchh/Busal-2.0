import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const productionUrl =
  process.env.PRODUCTION_URL?.trim() ||
  process.env.NEXT_PUBLIC_APP_URL?.trim() ||
  "https://www.getbusal.com";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function read(relativePath: string): string {
  return readFileSync(join(root, relativePath), "utf8");
}

async function checkHealthEndpoint(baseUrl: string): Promise<void> {
  const url = `${baseUrl.replace(/\/$/, "")}/api/health`;
  const response = await fetch(url, { signal: AbortSignal.timeout(15_000) });

  assert(response.ok, `Health check failed: ${url} returned ${response.status}`);

  const body = (await response.json()) as { status?: string; service?: string };
  assert(body.status === "ok", `Health check body invalid at ${url}`);
  assert(body.service === "busal-os", `Unexpected service name at ${url}`);
}

async function main() {
  console.log("Production deployment verification");
  console.log(`Target: ${productionUrl}\n`);

  console.log("Infrastructure files");
  assert(read("vercel.json").includes("www.getbusal.com"), "vercel.json missing www redirect");
  assert(read("next.config.ts").includes("Strict-Transport-Security"), "security headers missing");
  assert(
    read("public/robots.txt").includes("Sitemap: https://getbusal.com/sitemap.xml"),
    "robots.txt missing sitemap reference",
  );
  assert(read("public/sitemap.xml").includes("https://getbusal.com/"), "sitemap.xml misconfigured");
  assert(read("public/manifest.json").includes('"name": "Busal"'), "manifest.json misconfigured");
  assert(read("public/favicon.ico").length > 0, "public/favicon.ico missing");
  assert(
    read("src/config/site.ts").includes("/favicon.ico"),
    "site metadata favicon misconfigured",
  );
  assert(read("src/app/favicon.ico").length > 0, "src/app/favicon.ico missing");
  console.log("  PASS");

  console.log("Environment template");
  const envProduction = read(".env.production");
  assert(
    envProduction.includes("NEXT_PUBLIC_APP_URL=https://www.getbusal.com"),
    ".env.production canonical URL missing",
  );
  console.log("  PASS");

  console.log("Health endpoint smoke test");
  await checkHealthEndpoint(productionUrl);
  console.log("  PASS");

  console.log("Public routes smoke test");
  const homeResponse = await fetch(productionUrl, { signal: AbortSignal.timeout(15_000) });
  assert(homeResponse.ok, `Home page failed: ${productionUrl}`);
  console.log("  PASS");

  console.log("\nProduction deployment verification passed.");
  console.log("\nManual steps before www.getbusal.com go-live:");
  console.log("  1. Set Vercel production env vars (Supabase, DATABASE_URL, DIRECT_URL)");
  console.log("  2. Run: pnpm db:migrate:deploy");
  console.log("  3. Add www.getbusal.com + getbusal.com in Vercel Domains");
  console.log("  4. Point DNS CNAME www → cname.vercel-dns.com");
  console.log("  5. Configure Supabase Auth redirect URLs for www.getbusal.com");
}

main().catch((error) => {
  console.error("\nFIRST ERROR:", error instanceof Error ? error.message : error);
  process.exit(1);
});

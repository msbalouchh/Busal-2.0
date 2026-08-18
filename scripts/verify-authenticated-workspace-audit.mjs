/**
 * Authenticated workspace production audit (Playwright).
 * Usage:
 *   VERIFY_OWNER_EMAIL=owner@example.com VERIFY_OWNER_PASSWORD=secret node scripts/verify-authenticated-workspace-audit.mjs [baseUrl]
 */

import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnvFile(filename) {
  const path = join(root, filename);
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(".env");
loadEnvFile(".env.local");
loadEnvFile(".env.development");

const BASE =
  process.argv[2] ??
  process.env.AUDIT_BASE_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  "http://localhost:3002";

const OWNER_EMAIL =
  process.env.VERIFY_OWNER_EMAIL ??
  process.env.AUDIT_OWNER_EMAIL ??
  process.env.TEST_EMAIL ??
  (process.env.BUSAL_CONTROL_CENTER_OPERATORS?.split(",")[0]?.trim() || "");

const OWNER_PASSWORD =
  process.env.VERIFY_OWNER_PASSWORD ??
  process.env.AUDIT_OWNER_PASSWORD ??
  process.env.TEST_PASSWORD ??
  "";

const MODULE_ROUTES = [
  { module: "Dashboard", route: "/dashboard" },
  { module: "Business", route: "/dashboard/business" },
  { module: "CRM", route: "/dashboard/crm" },
  { module: "Customers", route: "/dashboard/crm/customers" },
  { module: "Menu", route: "/dashboard/menu" },
  { module: "Tables", route: "/dashboard/tables" },
  { module: "Reservations", route: "/dashboard/reservations" },
  { module: "Orders", route: "/dashboard/restaurant/orders" },
  { module: "Kitchen", route: "/dashboard/kitchen" },
  { module: "POS", route: "/dashboard/pos" },
  { module: "Inventory", route: "/dashboard/inventory" },
  { module: "Staff", route: "/dashboard/staff" },
  { module: "Finance", route: "/dashboard/revops" },
  { module: "Payments", route: "/dashboard/payments" },
  { module: "Receipts", route: "/dashboard/receipts" },
  { module: "QR Menu", route: "/dashboard/qr-menu" },
  { module: "Analytics", route: "/dashboard/reporting" },
  { module: "Notifications", route: "/dashboard/notifications" },
  { module: "Settings", route: "/dashboard/settings" },
  { module: "AI Assistant", route: "/dashboard/ai-platform/assistant" },
];

const FAILURE_PATTERNS = [
  /something went wrong/i,
  /unable to load this page/i,
  /application error/i,
  /internal server error/i,
  /permission denied/i,
  /unhandled runtime error/i,
];

async function loginViaApi(request, email, password) {
  const response = await request.post(`${BASE}/api/auth/login`, {
    data: { email, password },
  });
  const body = await response.json();
  if (!response.ok() || !body?.success) {
    throw new Error(`Login failed (${response.status()}): ${JSON.stringify(body).slice(0, 300)}`);
  }
  return body;
}

async function main() {
  if (!OWNER_EMAIL || !OWNER_PASSWORD) {
    throw new Error(
      "Set VERIFY_OWNER_EMAIL and VERIFY_OWNER_PASSWORD (or AUDIT_OWNER_*) for authenticated audit.",
    );
  }

  console.log(`Authenticated workspace audit`);
  console.log(`Base URL: ${BASE}`);
  console.log(`Owner: ${OWNER_EMAIL}\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const consoleErrors = [];
  const pageErrors = [];
  const networkFailures = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
    }
  });
  page.on("pageerror", (err) => {
    pageErrors.push(err.message);
  });
  page.on("requestfailed", (req) => {
    const failure = req.failure();
    if (failure && !req.url().includes("favicon")) {
      networkFailures.push(`${req.method()} ${req.url()} — ${failure.errorText}`);
    }
  });

  const loginStart = Date.now();
  await loginViaApi(context.request, OWNER_EMAIL, OWNER_PASSWORD);
  const loginMs = Date.now() - loginStart;
  console.log(`Login: PASS (${loginMs}ms)`);

  const sessionResp = await context.request.get(`${BASE}/api/auth/session`);
  const sessionBody = await sessionResp.json();
  if (!sessionResp.ok() || !sessionBody?.success) {
    throw new Error("Session persistence failed after login");
  }
  console.log("Session persistence: PASS");

  const businessNameHint = sessionBody?.user?.email ? OWNER_EMAIL : null;

  const moduleResults = [];
  const perf = { loginMs, routes: [] };

  for (const { module, route } of MODULE_ROUTES) {
    const started = Date.now();
    const routeConsoleBefore = consoleErrors.length;
    const routePageBefore = pageErrors.length;
    const routeNetworkBefore = networkFailures.length;

    let status = "PASS";
    let detail = "";
    let hasErrorUi = false;
    let hasHydrationWarning = false;

    try {
      const response = await page.goto(`${BASE}${route}`, {
        waitUntil: "domcontentloaded",
        timeout: 60_000,
      });

      const httpStatus = response?.status() ?? 0;
      if (httpStatus >= 500) {
        status = "FAIL";
        detail = `HTTP ${httpStatus}`;
      }

      await page.waitForTimeout(1500);

      const finalUrl = page.url();
      if (finalUrl.includes("/login")) {
        status = "FAIL";
        detail = "Redirected to login";
      }

      const bodyText = await page.locator("body").innerText();
      for (const pattern of FAILURE_PATTERNS) {
        if (pattern.test(bodyText)) {
          hasErrorUi = true;
          if (status === "PASS") {
            status = "FAIL";
            detail = `Error UI: ${pattern}`;
          }
        }
      }

      if (bodyText.toLowerCase().includes("hydration")) {
        hasHydrationWarning = true;
      }
    } catch (error) {
      status = "FAIL";
      detail = error instanceof Error ? error.message : String(error);
    }

    const elapsed = Date.now() - started;
    perf.routes.push({ module, route, ms: elapsed });

    const newConsole = consoleErrors.slice(routeConsoleBefore);
    const newPage = pageErrors.slice(routePageBefore);
    const newNetwork = networkFailures.slice(routeNetworkBefore);

    if (newPage.length > 0 && status === "PASS") {
      status = "FAIL";
      detail = newPage[0];
    }

    moduleResults.push({
      module,
      route,
      status,
      detail,
      ms: elapsed,
      consoleErrors: newConsole.length,
      pageErrors: newPage.length,
      networkFailures: newNetwork.length,
      hasErrorUi,
      hasHydrationWarning,
    });

    const icon = status === "PASS" ? "PASS" : "FAIL";
    console.log(
      `  ${icon}  ${module.padEnd(16)} ${route.padEnd(40)} ${elapsed}ms${detail ? ` — ${detail}` : ""}`,
    );
  }

  await browser.close();

  const passed = moduleResults.filter((r) => r.status === "PASS").map((r) => r.module);
  const failed = moduleResults.filter((r) => r.status === "FAIL");

  const slowRoutes = perf.routes.filter((r) => r.ms > 5000);
  const avgNav =
    perf.routes.reduce((sum, r) => sum + r.ms, 0) / Math.max(perf.routes.length, 1);

  console.log("\n--- Summary ---");
  console.log(`Verified: ${passed.length}/${moduleResults.length}`);
  console.log(`Avg navigation: ${Math.round(avgNav)}ms`);
  console.log(`Login: ${loginMs}ms`);
  if (slowRoutes.length) {
    console.log(`Slow routes (>5s): ${slowRoutes.map((r) => r.module).join(", ")}`);
  }
  if (consoleErrors.length) {
    console.log(`Total console errors: ${consoleErrors.length}`);
  }
  if (networkFailures.length) {
    console.log(`Total network failures: ${networkFailures.length}`);
  }

  const report = {
    baseUrl: BASE,
    ownerEmail: OWNER_EMAIL,
    businessNameHint,
    passed,
    failed,
    perf: {
      loginMs,
      avgNavigationMs: Math.round(avgNav),
      slowRoutes,
    },
    consoleErrors: consoleErrors.slice(0, 20),
    networkFailures: networkFailures.slice(0, 20),
    moduleResults,
  };

  console.log("\n--- JSON ---");
  console.log(JSON.stringify(report, null, 2));

  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

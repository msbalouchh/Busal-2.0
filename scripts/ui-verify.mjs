/**
 * One-off UI route verification — visits key routes and collects console errors + layout signals.
 * Run: node scripts/ui-verify.mjs
 */
import { chromium, devices } from "playwright";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";

const MARKETING_ROUTES = [
  "/",
  "/pricing",
  "/careers",
  "/partners",
  "/privacy",
  "/terms",
  "/about",
  "/contact",
];

const DASHBOARD_ROUTES = [
  "/dashboard",
  "/dashboard/ai-platform",
  "/dashboard/ai-platform/tools",
  "/dashboard/ai-platform/agents",
  "/dashboard/ai-platform/knowledge",
  "/dashboard/ai-platform/automation",
  "/dashboard/ai-platform/analytics",
  "/dashboard/ai-platform/settings",
  "/dashboard/ai-platform/assistant",
  "/dashboard/crm",
  "/dashboard/restaurant/orders",
  "/dashboard/menu",
  "/dashboard/reservations",
  "/dashboard/kitchen",
  "/dashboard/pos",
  "/dashboard/inventory",
  "/dashboard/staff",
  "/dashboard/payments",
  "/dashboard/receipts",
  "/dashboard/reporting",
  "/dashboard/revops",
  "/dashboard/api-gateway",
  "/dashboard/settings",
  "/dashboard/restaurant",
  "/dashboard/commercial",
  "/dashboard/commercial-platform",
  "/dashboard/ai-agents",
  "/dashboard/ai-knowledge",
  "/dashboard/ai-tools",
  "/dashboard/ai-automation",
];

const ONBOARDING_ROUTES = ["/business-onboarding"];

const VIEWPORTS = [
  { name: "desktop", context: {} },
  { name: "tablet", context: { ...devices["iPad (gen 7)"] } },
  { name: "mobile", context: { ...devices["iPhone 13"] } },
];

async function visitRoute(page, route, viewportName) {
  const consoleErrors = [];
  const consoleWarnings = [];
  page.on("console", (msg) => {
    const type = msg.type();
    const text = msg.text();
    if (type === "error") consoleErrors.push(text);
    if (type === "warning" && /hydration|react/i.test(text)) consoleWarnings.push(text);
  });
  page.on("pageerror", (err) => consoleErrors.push(err.message));

  let status = 0;
  let finalUrl = route;
  let h1Count = 0;
  let horizontalScroll = false;
  let overflowElements = 0;

  try {
    const response = await page.goto(`${BASE}${route}`, {
      waitUntil: "networkidle",
      timeout: 45000,
    });
    status = response?.status() ?? 0;
    finalUrl = page.url();

    h1Count = await page.locator("h1").count();

    horizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth + 2;
    });

    overflowElements = await page.evaluate(() => {
      let count = 0;
      for (const el of document.querySelectorAll("body *")) {
        const rect = el.getBoundingClientRect();
        if (rect.width > window.innerWidth + 4) count++;
      }
      return count;
    });
  } catch (err) {
    consoleErrors.push(`Navigation failed: ${err.message}`);
  }

  return {
    route,
    viewport: viewportName,
    status,
    finalUrl,
    h1Count,
    horizontalScroll,
    overflowElements,
    consoleErrors: [...new Set(consoleErrors)],
    consoleWarnings: [...new Set(consoleWarnings)],
  };
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (const viewport of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: viewport.context.viewport ?? { width: 1440, height: 900 },
      userAgent: viewport.context.userAgent,
      isMobile: viewport.context.isMobile,
      hasTouch: viewport.context.hasTouch,
    });
    const page = await context.newPage();

    for (const route of [...MARKETING_ROUTES, ...ONBOARDING_ROUTES, ...DASHBOARD_ROUTES]) {
      results.push(await visitRoute(page, route, viewport.name));
    }

    await context.close();
  }

  await browser.close();

  const report = {
    base: BASE,
    visited: results.length,
    routes: results,
    summary: {
      duplicateH1: results.filter((r) => r.h1Count > 1),
      horizontalScroll: results.filter((r) => r.horizontalScroll),
      overflow: results.filter((r) => r.overflowElements > 0),
      consoleErrors: results.filter((r) => r.consoleErrors.length > 0),
      hydrationWarnings: results.filter((r) => r.consoleWarnings.length > 0),
      redirected: results.filter((r) => !r.finalUrl.includes(r.route.replace(/\/$/, ""))),
    },
  };

  console.log(JSON.stringify(report, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

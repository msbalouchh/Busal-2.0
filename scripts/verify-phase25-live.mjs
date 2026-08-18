/**
 * Phase 25 live route verification — run while `pnpm start` is serving production build.
 * Usage: node scripts/verify-phase25-live.mjs [baseUrl]
 */
const baseUrl = (process.argv[2] ?? process.env.BUSAL_BASE_URL ?? "http://localhost:3000").replace(
  /\/+$/,
  "",
);

const PUBLIC_ROUTES = [
  "/",
  "/pricing",
  "/login",
  "/signup",
  "/forgot-password",
  "/verify-email",
  "/app/developer/docs",
];

const PROTECTED_ROUTES = [
  "/dashboard",
  "/dashboard/business",
  "/dashboard/crm",
  "/dashboard/customers",
  "/dashboard/menu",
  "/dashboard/tables",
  "/dashboard/reservations",
  "/dashboard/restaurant/orders",
  "/dashboard/kitchen",
  "/dashboard/pos",
  "/dashboard/inventory",
  "/dashboard/staff",
  "/dashboard/revops",
  "/dashboard/payments",
  "/dashboard/receipts",
  "/dashboard/qr-menu",
  "/dashboard/reporting",
  "/dashboard/notifications",
  "/dashboard/settings",
  "/dashboard/ai-platform/assistant",
  "/dashboard/tenant-platform/white-label",
  "/app/developer",
  "/app/developer/keys",
  "/app/developer/webhooks",
  "/business-onboarding",
];

const API_ROUTES = [
  { method: "GET", path: "/api/v1/businesses", expect: [401, 403] },
  { method: "GET", path: "/api/v1/customers", expect: [401, 403] },
  { method: "GET", path: "/api/v1/orders", expect: [401, 403] },
  { method: "GET", path: "/api/v1/menu", expect: [401, 403] },
  { method: "GET", path: "/api/v1/reservations", expect: [401, 403] },
  { method: "GET", path: "/api/v1/staff", expect: [401, 403] },
  { method: "GET", path: "/api/v1/inventory", expect: [401, 403] },
  { method: "GET", path: "/api/v1/payments", expect: [401, 403] },
  { method: "GET", path: "/api/v1/analytics", expect: [401, 403] },
  { method: "GET", path: "/api/embed/menu?token=invalid", expect: [401, 403, 500] },
  { method: "POST", path: "/api/webhooks/stripe", expect: [400, 503] },
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function fetchRoute(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    redirect: "manual",
    ...options,
  });
  return response;
}

async function main() {
  console.log(`Phase 25 live verification against ${baseUrl}`);

  for (const path of PUBLIC_ROUTES) {
    const response = await fetchRoute(path);
    assert(response.status < 500, `${path} returned server error ${response.status}`);
    console.log(`OK public ${path} -> ${response.status}`);
  }

  for (const path of PROTECTED_ROUTES) {
    const response = await fetchRoute(path);
    const redirected = response.status >= 300 && response.status < 400;
    const loginRedirect =
      response.headers.get("location")?.includes("/login") ||
      response.headers.get("location")?.includes("/auth");
    assert(
      redirected || response.status === 401 || loginRedirect,
      `${path} should redirect unauthenticated users (got ${response.status})`,
    );
    console.log(`OK protected ${path} -> ${response.status}`);
  }

  for (const route of API_ROUTES) {
    const response = await fetchRoute(route.path, { method: route.method });
    assert(
      route.expect.includes(response.status),
      `${route.method} ${route.path} expected ${route.expect.join("|")}, got ${response.status}`,
    );
    console.log(`OK api ${route.method} ${route.path} -> ${response.status}`);
  }

  const invalidKey = await fetchRoute("/api/v1/businesses", {
    headers: { Authorization: "Bearer bk_invalid_key_for_test" },
  });
  assert(
    [401, 403].includes(invalidKey.status),
    `Invalid API key should be denied, got ${invalidKey.status}`,
  );
  console.log(`OK invalid API key -> ${invalidKey.status}`);

  console.log("Phase 25 live verification passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

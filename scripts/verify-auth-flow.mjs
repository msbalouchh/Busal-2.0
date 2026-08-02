/**
 * End-to-end auth flow verification against running dev server.
 * Usage: node scripts/verify-auth-flow.mjs [baseUrl]
 */

const BASE = process.argv[2] ?? "http://localhost:3000";
const unique = Date.now();
const testEmail = `auth-test-${unique}@getbusal.com`;
const testPassword = "TestPass123!";
const signupPayload = {
  businessName: "Auth Test Co",
  fullName: "Auth Tester",
  email: testEmail,
  password: testPassword,
  confirmPassword: testPassword,
  acceptTerms: true,
};

const results = {};

function pass(key) {
  results[key] = "PASS";
}

function fail(key, reason) {
  results[key] = `FAIL (${reason})`;
}

class CookieJar {
  constructor() {
    this.cookies = new Map();
  }

  ingest(setCookieHeader) {
    if (!setCookieHeader) return;
    const parts = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
    for (const part of parts) {
      const [pair] = part.split(";");
      const eq = pair.indexOf("=");
      if (eq === -1) continue;
      const name = pair.slice(0, eq).trim();
      const value = pair.slice(eq + 1).trim();
      if (value === "" || /Max-Age=0/i.test(part)) {
        this.cookies.delete(name);
      } else {
        this.cookies.set(name, value);
      }
    }
  }

  header() {
    if (this.cookies.size === 0) return undefined;
    return [...this.cookies.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
  }

  hasSupabaseSession() {
    return [...this.cookies.keys()].some(
      (name) => name.startsWith("sb-") && name.endsWith("-auth-token"),
    );
  }

  clear() {
    this.cookies.clear();
  }
}

async function request(path, { method = "GET", body, jar, redirect = "manual" } = {}) {
  const headers = { Accept: "application/json, text/html" };
  if (body) headers["Content-Type"] = "application/json";
  const cookie = jar?.header();
  if (cookie) headers.Cookie = cookie;

  const response = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    redirect,
  });

  const setCookie = response.headers.getSetCookie?.() ?? [];
  if (setCookie.length === 0) {
    const single = response.headers.get("set-cookie");
    if (single) setCookie.push(single);
  }
  jar?.ingest(setCookie);

  const contentType = response.headers.get("content-type") ?? "";
  let data = null;
  if (contentType.includes("application/json")) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  return { response, data, location: response.headers.get("location") };
}

async function main() {
  const jar = new CookieJar();

  // 1. Signup
  try {
    const { response, data } = await request("/api/auth/signup", {
      method: "POST",
      body: signupPayload,
      jar,
    });
    const ok = response.ok && data?.success === true;
    if (ok) {
      pass("Signup");
    } else {
      fail("Signup", `status=${response.status} body=${JSON.stringify(data).slice(0, 200)}`);
    }
  } catch (e) {
    fail("Signup", e.message);
  }

  // 2. Verify Email page
  try {
    const { response, data } = await request("/verify-email", { jar });
    const html = typeof data === "string" ? data : "";
    const ok =
      response.status === 200 &&
      (html.includes("Verify your email") || html.includes("verification link"));
    if (ok) pass("Verify Email page");
    else fail("Verify Email page", `status=${response.status}`);
  } catch (e) {
    fail("Verify Email page", e.message);
  }

  // 3. Login
  let loginRedirectPath = null;
  try {
    const { response, data } = await request("/api/auth/login", {
      method: "POST",
      body: { email: testEmail, password: testPassword },
      jar,
    });
    loginRedirectPath = data?.redirectPath ?? null;
    const ok = response.ok && data?.success === true && data?.user?.email === testEmail;
    if (ok) pass("Login");
    else fail("Login", `status=${response.status} body=${JSON.stringify(data).slice(0, 300)}`);
  } catch (e) {
    fail("Login", e.message);
  }

  // Session cookie exists
  try {
    if (jar.hasSupabaseSession()) pass("Session cookie exists");
    else fail("Session cookie exists", `cookies=${[...jar.cookies.keys()].join(", ") || "none"}`);
  } catch (e) {
    fail("Session cookie exists", e.message);
  }

  // 4. Redirect (post-login path from API)
  try {
    const allowed = ["/app", "/dashboard", "/business-onboarding", "/portal"];
    const ok = loginRedirectPath && allowed.some((p) => loginRedirectPath.startsWith(p));
    if (ok) pass("Redirect");
    else fail("Redirect", `redirectPath=${loginRedirectPath}`);
  } catch (e) {
    fail("Redirect", e.message);
  }

  // 5. Middleware — authenticated access to protected route
  try {
    const target = loginRedirectPath?.startsWith("/portal") ? "/portal" : "/app";
    const { response, location } = await request(target, { jar, redirect: "manual" });
    const ok =
      response.status === 200 ||
      (response.status >= 300 && response.status < 400 && !location?.includes("/login"));
    if (ok) pass("Middleware (authenticated)");
    else fail("Middleware (authenticated)", `status=${response.status} location=${location}`);
  } catch (e) {
    fail("Middleware (authenticated)", e.message);
  }

  // Middleware — unauthenticated redirect
  try {
    const unauthJar = new CookieJar();
    const { response, location } = await request("/app", { jar: unauthJar, redirect: "manual" });
    const ok =
      (response.status >= 300 && response.status < 400 && location?.includes("/login")) ||
      location?.includes("redirectTo");
    if (ok) pass("Middleware (unauthenticated redirect)");
    else
      fail(
        "Middleware (unauthenticated redirect)",
        `status=${response.status} location=${location}`,
      );
  } catch (e) {
    fail("Middleware (unauthenticated redirect)", e.message);
  }

  // Business onboarding redirect correctness (API-level)
  try {
    if (loginRedirectPath === "/business-onboarding") {
      const { response, data } = await request("/business-onboarding", { jar });
      const html = typeof data === "string" ? data : "";
      const ok = response.status === 200 && html.length > 0;
      if (ok) pass("Business onboarding redirect");
      else fail("Business onboarding redirect", `status=${response.status}`);
    } else if (loginRedirectPath === "/app" || loginRedirectPath === "/dashboard") {
      pass("Business onboarding redirect");
    } else {
      fail("Business onboarding redirect", `unexpected path ${loginRedirectPath}`);
    }
  } catch (e) {
    fail("Business onboarding redirect", e.message);
  }

  // Dashboard access
  try {
    const { response, location } = await request("/dashboard", { jar, redirect: "manual" });
    const ok =
      response.status === 200 ||
      (response.status >= 300 &&
        response.status < 400 &&
        !location?.includes("/login") &&
        (location?.includes("/dashboard") ||
          location?.includes("/app") ||
          location?.includes("/business-onboarding")));
    if (ok) pass("Dashboard access");
    else fail("Dashboard access", `status=${response.status} location=${location}`);
  } catch (e) {
    fail("Dashboard access", e.message);
  }

  // Session API with cookie
  try {
    const { response, data } = await request("/api/auth/session", { jar });
    const ok = response.status === 200 && data?.success === true && data?.user?.email;
    if (ok) pass("Session API");
    else
      fail("Session API", `status=${response.status} body=${JSON.stringify(data).slice(0, 200)}`);
  } catch (e) {
    fail("Session API", e.message);
  }

  // 6. Logout
  try {
    const { response, data } = await request("/api/auth/logout", { method: "POST", jar });
    const ok = response.ok && data?.success === true;
    if (ok) pass("Logout");
    else fail("Logout", `status=${response.status}`);
  } catch (e) {
    fail("Logout", e.message);
  }

  // Post-logout session cleared
  try {
    const { response } = await request("/api/auth/session", { jar });
    const ok = response.status === 401;
    if (ok) pass("Post-logout session cleared");
    else fail("Post-logout session cleared", `status=${response.status}`);
  } catch (e) {
    fail("Post-logout session cleared", e.message);
  }

  // Post-logout middleware blocks /app
  try {
    const { response, location } = await request("/app", { jar, redirect: "manual" });
    const ok = response.status >= 300 && response.status < 400 && location?.includes("/login");
    if (ok) pass("Post-logout middleware");
    else fail("Post-logout middleware", `status=${response.status} location=${location}`);
  } catch (e) {
    fail("Post-logout middleware", e.message);
  }

  console.log(JSON.stringify(results, null, 2));
  const failed = Object.values(results).some((v) => v.startsWith("FAIL"));
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

/** Canonical production origin for all user-facing Busal OS URLs. */
export const PRODUCTION_APP_ORIGIN = "https://www.getbusal.com";

function readEnvUrl(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

function stripTrailingSlash(url: string): string {
  return url.replace(/\/$/, "");
}

function formatOrigin(url: string): string {
  return stripTrailingSlash(url.startsWith("http") ? url : `https://${url}`);
}

function parseHostname(url: string): string | null {
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname.toLowerCase();
  } catch {
    return null;
  }
}

/** Hostnames that must never be used for user-facing navigation. */
export function isBlockedAppHost(hostOrUrl: string): boolean {
  const hostname =
    hostOrUrl.includes("/") || hostOrUrl.includes(":")
      ? parseHostname(hostOrUrl)
      : hostOrUrl.toLowerCase();

  if (!hostname) {
    return true;
  }

  return hostname.endsWith(".vercel.app");
}

function isLocalDevelopmentHost(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "[::1]" ||
    hostname.endsWith(".localhost")
  );
}

function resolveDevelopmentAppUrl(): string {
  const configured = readEnvUrl(process.env.NEXT_PUBLIC_APP_URL);

  if (configured) {
    const hostname = parseHostname(configured);

    if (hostname && (isLocalDevelopmentHost(hostname) || hostname.endsWith(".local"))) {
      return formatOrigin(configured);
    }
  }

  const port = readEnvUrl(process.env.PORT) ?? "3000";
  return `http://127.0.0.1:${port}`;
}

/**
 * Resolves the public application origin for metadata, redirects, and auth callbacks.
 *
 * Production always resolves to https://www.getbusal.com.
 * Development resolves to localhost (or an explicit local NEXT_PUBLIC_APP_URL).
 * Vercel preview hosts are never returned.
 */
export function resolvePublicAppUrl(): string {
  if (process.env.NODE_ENV === "development") {
    return resolveDevelopmentAppUrl();
  }

  const configured = readEnvUrl(process.env.NEXT_PUBLIC_APP_URL);

  if (configured && !isBlockedAppHost(configured)) {
    const origin = formatOrigin(configured);

    if (origin.includes("getbusal.com")) {
      return origin.startsWith("https://www.") ? origin : PRODUCTION_APP_ORIGIN;
    }
  }

  return PRODUCTION_APP_ORIGIN;
}

/** Returns a canonical origin when the incoming host must not serve user traffic. */
export function resolveCanonicalOriginForHost(host: string | null | undefined): string | null {
  if (process.env.NODE_ENV === "development" || !host) {
    return null;
  }

  const hostname = host.split(":")[0]?.toLowerCase() ?? "";

  if (!hostname || hostname === "www.getbusal.com") {
    return null;
  }

  if (isBlockedAppHost(hostname) || hostname === "getbusal.com") {
    return PRODUCTION_APP_ORIGIN;
  }

  return null;
}

export function buildAppUrl(path: string, origin = resolvePublicAppUrl()): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${stripTrailingSlash(origin)}${normalizedPath}`;
}

export function normalizeEnvUrl(value: string | undefined): string | undefined {
  return readEnvUrl(value);
}

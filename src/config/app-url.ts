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

/**
 * Resolves the public application origin for metadata, redirects, and auth callbacks.
 *
 * Resolution order:
 * 1. NEXT_PUBLIC_APP_URL (explicit project configuration)
 * 2. VERCEL_PROJECT_PRODUCTION_URL (Vercel production domain)
 * 3. VERCEL_URL (Vercel deployment host, available during Vercel builds)
 * 4. Local development host derived from PORT
 */
export function resolvePublicAppUrl(): string {
  const configured = readEnvUrl(process.env.NEXT_PUBLIC_APP_URL);
  if (configured) {
    return formatOrigin(configured);
  }

  const productionUrl = readEnvUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL);
  if (productionUrl) {
    return formatOrigin(productionUrl);
  }

  const vercelUrl = readEnvUrl(process.env.VERCEL_URL);
  if (vercelUrl) {
    return formatOrigin(vercelUrl);
  }

  if (process.env.NODE_ENV === "development") {
    const port = readEnvUrl(process.env.PORT) ?? "3000";
    return `http://127.0.0.1:${port}`;
  }

  throw new Error(
    "Unable to resolve public app URL. Set NEXT_PUBLIC_APP_URL in your environment variables.",
  );
}

export function normalizeEnvUrl(value: string | undefined): string | undefined {
  return readEnvUrl(value);
}

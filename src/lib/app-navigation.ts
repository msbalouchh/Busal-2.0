import { PRODUCTION_APP_ORIGIN } from "@/config/app-url";

function getClientAppOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (configured) {
    return configured.replace(/\/$/, "");
  }

  return PRODUCTION_APP_ORIGIN;
}

/** Performs a full navigation to an in-app path on the canonical app origin. */
export function assignAppPath(path: string): void {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  window.location.assign(`${getClientAppOrigin()}${normalizedPath}`);
}

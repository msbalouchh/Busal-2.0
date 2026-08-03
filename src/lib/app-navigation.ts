import { clientEnv } from "@/config/env.client";

function getClientAppOrigin(): string {
  return clientEnv.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
}

/** Performs a full navigation to an in-app path on the canonical app origin. */
export function assignAppPath(path: string): void {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  window.location.assign(`${getClientAppOrigin()}${normalizedPath}`);
}

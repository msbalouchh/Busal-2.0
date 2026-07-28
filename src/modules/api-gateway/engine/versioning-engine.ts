import type { ApiVersionStrategy } from "@prisma/client";

export function resolveVersionFromRequest(input: {
  uriPath: string;
  headerVersion?: string | null;
  strategy: ApiVersionStrategy;
}): string {
  if (input.strategy === "HEADER" && input.headerVersion) {
    return input.headerVersion;
  }

  const match = input.uriPath.match(/^\/api\/(v\d+)\//);
  return match?.[1] ?? input.headerVersion ?? "v1";
}

export function buildVersionedPath(basePath: string, version: string): string {
  if (basePath.startsWith("/api/")) {
    return basePath;
  }

  return `/api/${version}${basePath.startsWith("/") ? basePath : `/${basePath}`}`;
}

export function isSupportedVersion(version: string): boolean {
  return /^v\d+$/.test(version);
}

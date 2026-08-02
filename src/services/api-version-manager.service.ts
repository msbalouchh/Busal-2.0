import "server-only";

import type { PlatformApiVersion } from "@prisma/client";

export const PUBLIC_API_MODULES = [
  "authentication",
  "businesses",
  "branches",
  "users",
  "staff",
  "customers",
  "orders",
  "reservations",
  "inventory",
  "products",
  "crm",
  "reports",
  "documents",
  "media",
  "ai",
  "automation",
  "communication",
  "integrations",
] as const;

export const SDK_FRAMEWORK_LANGUAGES = [
  "JavaScript",
  "TypeScript",
  "Python",
  "PHP",
  "Java",
  "C#",
] as const;

export interface ApiRouteDefinition {
  method: string;
  path: string;
  module: (typeof PUBLIC_API_MODULES)[number];
  version: PlatformApiVersion;
  description: string;
}

export const API_ROUTE_CATALOG: ApiRouteDefinition[] = PUBLIC_API_MODULES.flatMap((module) => [
  {
    method: "GET",
    path: `/api/${module}`,
    module,
    version: "V1" as PlatformApiVersion,
    description: `List ${module} resources`,
  },
  {
    method: "POST",
    path: `/api/${module}`,
    module,
    version: "V1" as PlatformApiVersion,
    description: `Create ${module} resource`,
  },
]);

export function resolveApiVersion(
  requested: string | null | undefined,
  defaultVersion: PlatformApiVersion = "V1",
): PlatformApiVersion {
  if (requested === "V2") return "V2";
  if (requested === "V1") return "V1";
  return defaultVersion;
}

export function buildVersionedPath(path: string, version: PlatformApiVersion): string {
  const prefix = version === "V2" ? "/api/v2" : "/api/v1";
  return path.startsWith("/api/") ? path.replace(/^\/api/, prefix) : `${prefix}${path}`;
}

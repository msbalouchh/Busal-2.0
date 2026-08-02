import "server-only";

import {
  authorizeDeveloperApiRequest,
  type DeveloperApiAuthContext,
} from "@/services/developer-api-gateway.service";

export function checkScopedPermission(context: DeveloperApiAuthContext, scope: string): boolean {
  return authorizeDeveloperApiRequest(context, scope);
}

export function checkModuleAccess(
  context: DeveloperApiAuthContext,
  module: string,
  action: "read" | "write" = "read",
): boolean {
  return authorizeDeveloperApiRequest(context, `${module}.${action}`);
}

export const DEFAULT_API_SCOPES = [
  "businesses.read",
  "orders.read",
  "orders.write",
  "customers.read",
  "documents.read",
  "media.read",
  "*",
] as const;

import "server-only";

import { DEFAULT_APP_PERMISSIONS } from "@/modules/app-marketplace-management/constants/categories";

export function validateAppPermissions(required: string[]): { valid: boolean; missing: string[] } {
  const missing = required.filter(
    (perm) => !DEFAULT_APP_PERMISSIONS.includes(perm as (typeof DEFAULT_APP_PERMISSIONS)[number]),
  );
  return { valid: missing.length === 0 || required.length === 0, missing };
}

export interface SandboxFramework {
  isolated: boolean;
  simulated: boolean;
  allowedScopes: string[];
}

export function createAppSandbox(requiredPermissions: string[]): SandboxFramework {
  return {
    isolated: true,
    simulated: true,
    allowedScopes: requiredPermissions,
  };
}

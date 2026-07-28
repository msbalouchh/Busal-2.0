import {
  evaluatePermission,
  toPermissionEvaluationContext,
} from "@/modules/iam/engine/permission-engine";

import type { GatewayAuthContext } from "@/modules/api-gateway/types/api-gateway-types";

export function authorizeGatewayRequest(input: {
  auth: GatewayAuthContext;
  requiredPermission?: string | null;
  requiredScopes?: string[];
}): { allowed: boolean; reason: string } {
  const context = toPermissionEvaluationContext({
    permissions: input.auth.permissions,
    roleSlug: input.auth.roleSlug ?? null,
    isOwner: input.auth.isOwner,
    businessId: input.auth.businessId ?? null,
    branchId: input.auth.branchId ?? null,
  });

  if (input.requiredPermission && !evaluatePermission(context, input.requiredPermission)) {
    return { allowed: false, reason: `Permission denied: ${input.requiredPermission}` };
  }

  if (input.requiredScopes?.length) {
    const grantedScopes = new Set(input.auth.apiScopes);
    const missing = input.requiredScopes.filter((scope) => !grantedScopes.has(scope));

    if (missing.length > 0 && !input.auth.isOwner) {
      return { allowed: false, reason: `Missing API scopes: ${missing.join(", ")}` };
    }
  }

  return { allowed: true, reason: "Authorized" };
}

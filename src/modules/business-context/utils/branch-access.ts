import "server-only";

import { hasPermission } from "@/modules/authorization/services/authorization.service";
import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import type { BusinessContext } from "@/modules/business-context/types/business-context";
import { BusinessContextError } from "@/modules/business-context/utils/business-context-errors";

export function assertBranchAccess(context: BusinessContext, branchId: string | null): void {
  if (!branchId) {
    return;
  }

  if (context.isOwner) {
    return;
  }

  if (hasPermission(context.authorization.permissions, PERMISSION_CODES.BRANCH_MANAGE)) {
    return;
  }

  const assignedBranchId = context.staffSession?.branchId ?? null;

  if (assignedBranchId && assignedBranchId !== branchId) {
    throw new BusinessContextError("BRANCH_ACCESS_DENIED");
  }

  const canAccess = context.accessibleBranches.some((branch) => branch.id === branchId);

  if (!canAccess) {
    throw new BusinessContextError("BRANCH_ACCESS_DENIED");
  }
}

export function assertActiveBranch(context: BusinessContext): string {
  if (!context.branchId) {
    throw new BusinessContextError("BRANCH_REQUIRED");
  }

  assertBranchAccess(context, context.branchId);

  return context.branchId;
}

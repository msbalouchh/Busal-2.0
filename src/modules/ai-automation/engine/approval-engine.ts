import type { AutomationApprovalType } from "@prisma/client";

import type { BusinessContext } from "@/modules/business-context/types/business-context";
import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import type { WorkflowNode } from "@/modules/ai-automation/types/automation-types";

export function resolveRequiredApprovalPermission(approvalType: AutomationApprovalType): string {
  switch (approvalType) {
    case "MANAGER":
      return PERMISSION_CODES.AI_AUTOMATION_APPROVE;
    case "FINANCE":
      return PERMISSION_CODES.REVENUE_MANAGE;
    case "OWNER":
      return PERMISSION_CODES.BUSINESS_UPDATE;
    case "CUSTOM":
    default:
      return PERMISSION_CODES.AI_AUTOMATION_APPROVE;
  }
}

export function canApproveAutomationStep(
  platform: BusinessContext,
  approvalType: AutomationApprovalType,
  approverRole?: string | null,
): boolean {
  if (!platform.permissions.includes(PERMISSION_CODES.AI_AUTOMATION_APPROVE)) {
    return false;
  }

  if (approvalType === "OWNER") {
    return platform.isOwner;
  }

  if (approvalType === "FINANCE") {
    return platform.permissions.includes(PERMISSION_CODES.REVENUE_MANAGE);
  }

  if (approvalType === "MANAGER") {
    return platform.roleSlug === "manager" || platform.roleSlug === "owner";
  }

  if (approvalType === "CUSTOM" && approverRole) {
    return platform.roleSlug === approverRole;
  }

  return true;
}

export function getApprovalTypeFromNode(node: WorkflowNode): AutomationApprovalType {
  const approvalType = node.config.approvalType;
  if (
    approvalType === "MANAGER" ||
    approvalType === "FINANCE" ||
    approvalType === "OWNER" ||
    approvalType === "CUSTOM"
  ) {
    return approvalType;
  }

  return "MANAGER";
}

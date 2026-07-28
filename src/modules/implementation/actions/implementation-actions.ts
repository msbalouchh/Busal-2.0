"use server";

import { revalidatePath } from "next/cache";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedAction } from "@/modules/platform-guards/guards/action.guards";
import { IMPLEMENTATION_ROUTES } from "@/modules/implementation/constants/routes";
import {
  assignImplementationProject,
  closeImplementationProject,
  completeGoLiveChecklistItem,
  createChangeRequest,
  createImplementationIssue,
  createImplementationRisk,
  createProjectTemplate,
  executeGoLive,
  reviewChangeRequest,
  updateImplementationTaskStatus,
} from "@/services/implementation-delivery.service";

function revalidateImplementationPaths() {
  Object.values(IMPLEMENTATION_ROUTES).forEach((path) => {
    revalidatePath(path);
  });
}

export async function assignImplementationProjectAction(
  projectId: string,
  assignedStaffId: string | null,
) {
  return protectedAction(PERMISSION_CODES.IMPLEMENTATION_ASSIGN, async ({ business, platform }) => {
    await assignImplementationProject(
      projectId,
      business.id,
      platform.staffSession?.staffId ?? null,
      assignedStaffId,
    );
    revalidateImplementationPaths();
    return { success: true as const };
  });
}

export async function updateImplementationTaskStatusAction(
  taskId: string,
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "BLOCKED" | "CANCELLED",
) {
  return protectedAction(
    PERMISSION_CODES.IMPLEMENTATION_COMPLETE,
    async ({ business, platform }) => {
      await updateImplementationTaskStatus(
        taskId,
        business.id,
        platform.staffSession?.staffId ?? null,
        status,
      );
      revalidateImplementationPaths();
      return { success: true as const };
    },
  );
}

export async function completeGoLiveChecklistItemAction(itemId: string) {
  return protectedAction(
    PERMISSION_CODES.IMPLEMENTATION_COMPLETE,
    async ({ business, platform }) => {
      await completeGoLiveChecklistItem(
        itemId,
        business.id,
        platform.staffSession?.staffId ?? null,
      );
      revalidateImplementationPaths();
      return { success: true as const };
    },
  );
}

export async function executeGoLiveAction(projectId: string) {
  return protectedAction(
    PERMISSION_CODES.IMPLEMENTATION_APPROVE,
    async ({ business, platform }) => {
      await executeGoLive(projectId, business.id, platform.staffSession?.staffId ?? null);
      revalidateImplementationPaths();
      return { success: true as const };
    },
  );
}

export async function createImplementationRiskAction(
  projectId: string,
  input: {
    title: string;
    description?: string | null;
    severity?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  },
) {
  return protectedAction(PERMISSION_CODES.IMPLEMENTATION_MANAGE, async ({ business, platform }) => {
    await createImplementationRisk(
      projectId,
      business.id,
      platform.staffSession?.staffId ?? null,
      input,
    );
    revalidateImplementationPaths();
    return { success: true as const };
  });
}

export async function createImplementationIssueAction(
  projectId: string,
  input: { title: string; description?: string | null; reportedByCustomer?: boolean },
) {
  return protectedAction(PERMISSION_CODES.IMPLEMENTATION_MANAGE, async ({ business, platform }) => {
    await createImplementationIssue(
      projectId,
      business.id,
      platform.staffSession?.staffId ?? null,
      input,
    );
    revalidateImplementationPaths();
    return { success: true as const };
  });
}

export async function createChangeRequestAction(
  projectId: string,
  input: {
    title: string;
    description?: string | null;
    requestedByName?: string | null;
    requestedByEmail?: string | null;
  },
) {
  return protectedAction(PERMISSION_CODES.IMPLEMENTATION_MANAGE, async ({ business, platform }) => {
    await createChangeRequest(
      projectId,
      business.id,
      platform.staffSession?.staffId ?? null,
      input,
    );
    revalidateImplementationPaths();
    return { success: true as const };
  });
}

export async function reviewChangeRequestAction(changeRequestId: string, approved: boolean) {
  return protectedAction(
    PERMISSION_CODES.IMPLEMENTATION_APPROVE,
    async ({ business, platform }) => {
      await reviewChangeRequest(
        changeRequestId,
        business.id,
        platform.staffSession?.staffId ?? null,
        approved,
      );
      revalidateImplementationPaths();
      return { success: true as const };
    },
  );
}

export async function closeImplementationProjectAction(projectId: string) {
  return protectedAction(PERMISSION_CODES.IMPLEMENTATION_CLOSE, async ({ business, platform }) => {
    await closeImplementationProject(
      projectId,
      business.id,
      platform.staffSession?.staffId ?? null,
    );
    revalidateImplementationPaths();
    return { success: true as const };
  });
}

export async function createProjectTemplateAction(input: {
  name: string;
  industry: string;
  description?: string | null;
  milestones: Array<{
    name: string;
    description?: string | null;
    sortOrder: number;
    offsetDays?: number;
    tasks: Array<{
      title: string;
      description?: string | null;
      isMandatoryForGoLive?: boolean;
      visibleToCustomer?: boolean;
      sortOrder?: number;
    }>;
  }>;
}) {
  return protectedAction(PERMISSION_CODES.IMPLEMENTATION_MANAGE, async ({ business, platform }) => {
    const template = await createProjectTemplate(
      business.id,
      platform.staffSession?.staffId ?? null,
      input,
    );
    revalidateImplementationPaths();
    return { success: true as const, templateId: template.id };
  });
}

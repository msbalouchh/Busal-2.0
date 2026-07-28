"use server";

import { revalidatePath } from "next/cache";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedAction } from "@/modules/platform-guards/guards/action.guards";
import { CUSTOMER_SUCCESS_ROUTES } from "@/modules/customer-success/constants/routes";
import {
  assignCustomerSuccessTask,
  calculateCustomerHealthScore,
  completeCustomerSuccessTask,
  completeExecutiveReview,
  createExpansionOpportunity,
  createSuccessPlaybook,
  recordCustomerFeedback,
  scheduleCustomerRenewal,
  scheduleExecutiveReview,
} from "@/services/customer-success.service";

function revalidateCustomerSuccessPaths() {
  Object.values(CUSTOMER_SUCCESS_ROUTES).forEach((path) => {
    revalidatePath(path);
  });
}

export async function calculateCustomerHealthScoreAction(profileId: string) {
  return protectedAction(PERMISSION_CODES.SUCCESS_MANAGE, async ({ business, platform }) => {
    await calculateCustomerHealthScore(
      profileId,
      business.id,
      platform.staffSession?.staffId ?? null,
    );
    revalidateCustomerSuccessPaths();
    return { success: true as const };
  });
}

export async function completeCustomerSuccessTaskAction(taskId: string) {
  return protectedAction(PERMISSION_CODES.SUCCESS_MANAGE, async ({ business, platform }) => {
    await completeCustomerSuccessTask(taskId, business.id, platform.staffSession?.staffId ?? null);
    revalidateCustomerSuccessPaths();
    return { success: true as const };
  });
}

export async function assignCustomerSuccessTaskAction(
  taskId: string,
  assignedStaffId: string | null,
) {
  return protectedAction(PERMISSION_CODES.SUCCESS_ASSIGN, async ({ business, platform }) => {
    await assignCustomerSuccessTask(
      taskId,
      business.id,
      platform.staffSession?.staffId ?? null,
      assignedStaffId,
    );
    revalidateCustomerSuccessPaths();
    return { success: true as const };
  });
}

export async function recordCustomerFeedbackAction(
  profileId: string,
  input: {
    feedbackType: "CSAT" | "NPS" | "FEATURE_REQUEST" | "COMPLAINT";
    score?: number | null;
    title: string;
    content?: string | null;
    submittedByName?: string | null;
    submittedByEmail?: string | null;
  },
) {
  return protectedAction(PERMISSION_CODES.SUCCESS_MANAGE, async ({ business, platform }) => {
    await recordCustomerFeedback(
      profileId,
      business.id,
      platform.staffSession?.staffId ?? null,
      input,
    );
    revalidateCustomerSuccessPaths();
    return { success: true as const };
  });
}

export async function scheduleCustomerRenewalAction(
  profileId: string,
  input: { renewalDate: string; notes?: string | null },
) {
  return protectedAction(PERMISSION_CODES.SUCCESS_RENEW, async ({ business, platform }) => {
    await scheduleCustomerRenewal(profileId, business.id, platform.staffSession?.staffId ?? null, {
      renewalDate: new Date(input.renewalDate),
      notes: input.notes ?? null,
    });
    revalidateCustomerSuccessPaths();
    return { success: true as const };
  });
}

export async function createExpansionOpportunityAction(
  profileId: string,
  input: {
    expansionType: "UPSELL" | "CROSS_SELL";
    title: string;
    description?: string | null;
    estimatedValuePence?: number;
  },
) {
  return protectedAction(PERMISSION_CODES.SUCCESS_EXPAND, async ({ business, platform }) => {
    const result = await createExpansionOpportunity(
      profileId,
      business.id,
      platform.staffSession?.staffId ?? null,
      input,
    );
    revalidateCustomerSuccessPaths();
    return { success: true as const, ...result };
  });
}

export async function scheduleExecutiveReviewAction(
  profileId: string,
  input: { scheduledAt: string; attendees?: string | null },
) {
  return protectedAction(PERMISSION_CODES.SUCCESS_REVIEW, async ({ business, platform }) => {
    await scheduleExecutiveReview(profileId, business.id, platform.staffSession?.staffId ?? null, {
      scheduledAt: new Date(input.scheduledAt),
      attendees: input.attendees ?? null,
    });
    revalidateCustomerSuccessPaths();
    return { success: true as const };
  });
}

export async function completeExecutiveReviewAction(
  reviewId: string,
  input: { summary: string; nextReviewAt?: string | null },
) {
  return protectedAction(PERMISSION_CODES.SUCCESS_REVIEW, async ({ business, platform }) => {
    await completeExecutiveReview(reviewId, business.id, platform.staffSession?.staffId ?? null, {
      summary: input.summary,
      nextReviewAt: input.nextReviewAt ? new Date(input.nextReviewAt) : null,
    });
    revalidateCustomerSuccessPaths();
    return { success: true as const };
  });
}

export async function createSuccessPlaybookAction(input: {
  name: string;
  industry?: string | null;
  trigger?: "ACTIVATION" | "GO_LIVE" | "RENEWAL_DUE" | "HEALTH_AT_RISK" | "MANUAL";
  description?: string | null;
  steps: Array<{
    title: string;
    description?: string | null;
    taskType?: "GENERAL" | "RENEWAL" | "ONBOARDING" | "REVIEW" | "EXPANSION" | "FEEDBACK";
    sortOrder: number;
    offsetDays?: number;
  }>;
}) {
  return protectedAction(PERMISSION_CODES.SUCCESS_MANAGE, async ({ business, platform }) => {
    const playbook = await createSuccessPlaybook(
      business.id,
      platform.staffSession?.staffId ?? null,
      input,
    );
    revalidateCustomerSuccessPaths();
    return { success: true as const, playbookId: playbook.id };
  });
}

"use server";

import { revalidatePath } from "next/cache";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedAction } from "@/modules/platform-guards/guards/action.guards";
import { CRM_ROUTES } from "@/modules/crm/constants/routes";
import type { CustomerStatus } from "@prisma/client";
import type { RewardType } from "@prisma/client";
import {
  addCustomerNote,
  createCustomer,
  deactivateCustomer,
  updateCustomer,
} from "@/services/crm.service";
import {
  adjustLoyaltyPoints,
  createReward,
  redeemReward,
  updateLoyaltyProgram,
} from "@/services/loyalty.service";

function revalidateCrmPaths() {
  Object.values(CRM_ROUTES).forEach((path) => {
    if (typeof path === "string") {
      revalidatePath(path);
    }
  });
  revalidatePath(CRM_ROUTES.customers);
}

export async function createCustomerAction(input: {
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  tags?: string[];
  groupId?: string | null;
}) {
  return protectedAction(PERMISSION_CODES.CRM_MANAGE, async ({ business, platform }) => {
    const customer = await createCustomer(
      business.id,
      platform.staffSession?.staffId ?? null,
      input,
    );
    revalidateCrmPaths();
    return { success: true as const, customerId: customer.id };
  });
}

export async function updateCustomerAction(
  customerId: string,
  input: {
    name: string;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    notes?: string | null;
    tags?: string[];
    groupId?: string | null;
    status?: CustomerStatus;
  },
) {
  return protectedAction(PERMISSION_CODES.CRM_MANAGE, async ({ business, platform }) => {
    await updateCustomer(customerId, business.id, platform.staffSession?.staffId ?? null, input);
    revalidateCrmPaths();
    revalidatePath(CRM_ROUTES.customer(customerId));
    return { success: true as const };
  });
}

export async function addCustomerNoteAction(input: { customerId: string; content: string }) {
  return protectedAction(PERMISSION_CODES.CRM_MANAGE, async ({ business, platform }) => {
    await addCustomerNote(
      input.customerId,
      business.id,
      platform.staffSession?.staffId ?? null,
      input.content,
    );
    revalidatePath(CRM_ROUTES.customer(input.customerId));
    return { success: true as const };
  });
}

export async function adjustLoyaltyPointsAction(input: {
  customerId: string;
  pointsChange: number;
  reason: string;
}) {
  return protectedAction(PERMISSION_CODES.CRM_MANAGE, async ({ business, platform }) => {
    await adjustLoyaltyPoints(
      business.id,
      input.customerId,
      platform.staffSession?.staffId ?? null,
      input.pointsChange,
      input.reason,
    );
    revalidateCrmPaths();
    return { success: true as const };
  });
}

export async function createRewardAction(input: {
  name: string;
  type: RewardType;
  valuePence?: number | null;
  percentageBps?: number | null;
  menuItemId?: string | null;
  pointsCost?: number;
}) {
  return protectedAction(PERMISSION_CODES.CRM_MANAGE, async ({ business, platform }) => {
    await createReward(business.id, platform.staffSession?.staffId ?? null, input);
    revalidateCrmPaths();
    return { success: true as const };
  });
}

export async function redeemRewardAction(input: {
  customerId: string;
  rewardId: string;
  orderId?: string | null;
}) {
  return protectedAction(PERMISSION_CODES.CRM_MANAGE, async ({ business, platform }) => {
    await redeemReward(
      business.id,
      input.customerId,
      input.rewardId,
      platform.staffSession?.staffId ?? null,
      input.orderId,
    );
    revalidatePath(CRM_ROUTES.customer(input.customerId));
    return { success: true as const };
  });
}

export async function updateLoyaltyProgramAction(input: {
  isEnabled?: boolean;
  earnPointsPerPound?: number;
  redeemPointsPerPence?: number;
}) {
  return protectedAction(PERMISSION_CODES.CRM_MANAGE, async ({ business, platform }) => {
    await updateLoyaltyProgram(business.id, platform.staffSession?.staffId ?? null, input);
    revalidateCrmPaths();
    return { success: true as const };
  });
}

export async function deactivateCustomerAction(input: { customerId: string }) {
  return protectedAction(PERMISSION_CODES.CRM_MANAGE, async ({ business, platform }) => {
    await deactivateCustomer(input.customerId, business.id, platform.staffSession?.staffId ?? null);
    revalidateCrmPaths();
    return { success: true as const };
  });
}

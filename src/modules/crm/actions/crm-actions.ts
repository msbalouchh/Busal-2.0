"use server";

import { revalidatePath } from "next/cache";

import { protectedAction } from "@/modules/platform-guards/guards/action.guards";
import { CRM_PERMISSIONS } from "@/modules/crm/constants/permissions";
import { CRM_ROUTES } from "@/modules/crm/constants/routes";
import { resolveCrmScope, toCrmPlatformContext } from "@/modules/crm/lib/crm-scope";
import { customerRepository } from "@/modules/crm/repository/customer-repository";
import { customerService } from "@/modules/crm/services/customer.service";
import type { CustomerStatus } from "@prisma/client";
import type { RewardType } from "@prisma/client";
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
  return protectedAction(CRM_PERMISSIONS.CRM_CREATE, async ({ business, platform }) => {
    const scope = resolveCrmScope(platform);
    const nameParts = input.name.trim().split(/\s+/);
    const firstName = nameParts[0] ?? input.name;
    const lastName = nameParts.slice(1).join(" ");

    const record = await customerService.create(
      {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        businessId: business.id,
        branchId: scope.branchId,
        firstName,
        lastName,
        email: input.email ?? null,
        phone: input.phone ?? null,
        tagIds: input.tags ?? [],
        segmentIds: input.groupId ? [input.groupId] : [],
      },
      platform.staffSession?.staffId ?? null,
    );

    if (input.address?.trim()) {
      await customerRepository.addAddress(scope, {
        customerId: record.customer.id,
        label: "Primary",
        line1: input.address.trim(),
        isDefault: true,
      });
    }

    if (input.notes?.trim()) {
      await customerRepository.addNote(
        scope,
        record.customer.id,
        input.notes.trim(),
        platform.staffSession?.staffId ?? null,
      );
    }

    revalidateCrmPaths();
    return { success: true as const, customerId: record.customer.id };
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
  return protectedAction(CRM_PERMISSIONS.CRM_UPDATE, async ({ business, platform }) => {
    const context = toCrmPlatformContext(resolveCrmScope(platform));
    const nameParts = input.name.trim().split(/\s+/);
    const firstName = nameParts[0] ?? input.name;
    const lastName = nameParts.slice(1).join(" ");

    await customerService.update(
      {
        customerId,
        firstName,
        lastName,
        email: input.email ?? null,
        phone: input.phone ?? null,
        tagIds: input.tags,
        segmentIds: input.groupId ? [input.groupId] : undefined,
      },
      { ...context, businessId: business.id },
      platform.staffSession?.staffId ?? null,
    );

    revalidateCrmPaths();
    revalidatePath(CRM_ROUTES.customer(customerId));
    return { success: true as const };
  });
}

export async function addCustomerNoteAction(input: { customerId: string; content: string }) {
  return protectedAction(CRM_PERMISSIONS.CRM_UPDATE, async ({ business, platform }) => {
    const context = toCrmPlatformContext(resolveCrmScope(platform));
    await customerService.addNote(
      input.customerId,
      input.content,
      { ...context, businessId: business.id },
      platform.staffSession?.staffId ?? null,
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
  return protectedAction(CRM_PERMISSIONS.CRM_MANAGE, async ({ business, platform }) => {
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
  return protectedAction(CRM_PERMISSIONS.CRM_MANAGE, async ({ business, platform }) => {
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
  return protectedAction(CRM_PERMISSIONS.CRM_MANAGE, async ({ business, platform }) => {
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
  return protectedAction(CRM_PERMISSIONS.CRM_MANAGE, async ({ business, platform }) => {
    await updateLoyaltyProgram(business.id, platform.staffSession?.staffId ?? null, input);
    revalidateCrmPaths();
    return { success: true as const };
  });
}

export async function deactivateCustomerAction(input: { customerId: string }) {
  return protectedAction(CRM_PERMISSIONS.CRM_DELETE, async ({ business, platform }) => {
    const context = toCrmPlatformContext(resolveCrmScope(platform));
    await customerService.softDelete(
      input.customerId,
      { ...context, businessId: business.id },
      platform.staffSession?.staffId ?? null,
    );
    revalidateCrmPaths();
    return { success: true as const };
  });
}

export async function restoreCustomerAction(input: { customerId: string }) {
  return protectedAction(CRM_PERMISSIONS.CRM_MANAGE, async ({ business, platform }) => {
    const context = toCrmPlatformContext(resolveCrmScope(platform));
    await customerService.restore(
      input.customerId,
      { ...context, businessId: business.id },
      platform.staffSession?.staffId ?? null,
    );
    revalidateCrmPaths();
    return { success: true as const };
  });
}

export async function mergeCustomersAction(input: {
  primaryCustomerId: string;
  secondaryCustomerId: string;
}) {
  return protectedAction(CRM_PERMISSIONS.CRM_MANAGE, async ({ business, platform }) => {
    const context = toCrmPlatformContext(resolveCrmScope(platform));
    await customerService.merge(
      input.primaryCustomerId,
      input.secondaryCustomerId,
      { ...context, businessId: business.id },
      platform.staffSession?.staffId ?? null,
    );
    revalidateCrmPaths();
    return { success: true as const };
  });
}

export async function importCustomersAction(input: {
  rows: Array<{
    name: string;
    email?: string | null;
    phone?: string | null;
    tags?: string;
    group?: string;
  }>;
}) {
  return protectedAction(CRM_PERMISSIONS.CRM_IMPORT, async ({ business, platform }) => {
    const context = toCrmPlatformContext(resolveCrmScope(platform));
    const result = await customerService.importCustomers(
      input.rows,
      { ...context, businessId: business.id },
      platform.staffSession?.staffId ?? null,
    );
    revalidateCrmPaths();
    return { success: true as const, ...result };
  });
}

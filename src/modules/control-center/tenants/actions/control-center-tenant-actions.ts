"use server";

import { revalidatePath } from "next/cache";

import type { TenantMaintenanceMode } from "@prisma/client";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedControlCenterAction } from "@/modules/control-center/guards/control-center.guards";
import { CONTROL_CENTER_TENANT_ROUTES } from "@/modules/control-center/tenants/constants/control-center-tenants";
import type {
  ControlCenterTenantDirectoryQuery,
  ControlCenterTenantResourceLimitsInput,
  CreateControlCenterTenantInput,
} from "@/modules/control-center/tenants/types/control-center-tenants-types";
import {
  createControlCenterTenant,
  queryControlCenterTenantDirectory,
  runControlCenterTenantLifecycleAction,
  runControlCenterTenantMaintenanceAction,
  runControlCenterTenantResourceLimitsUpdate,
  runControlCenterTenantResourceRefresh,
} from "@/services/control-center-tenants.service";

function revalidateTenantPages(businessId?: string) {
  revalidatePath(CONTROL_CENTER_TENANT_ROUTES.directory);
  if (businessId) {
    revalidatePath(CONTROL_CENTER_TENANT_ROUTES.detail(businessId));
  }
}

export async function queryControlCenterTenantsAction(query: ControlCenterTenantDirectoryQuery) {
  return protectedControlCenterAction(PERMISSION_CODES.CONTROL_CENTER_TENANTS, async () =>
    queryControlCenterTenantDirectory(query),
  );
}

export async function createControlCenterTenantAction(input: CreateControlCenterTenantInput) {
  return protectedControlCenterAction(
    PERMISSION_CODES.CONTROL_CENTER_TENANTS_EDIT,
    async ({ operator }) => {
      const result = await createControlCenterTenant(operator, input);
      revalidateTenantPages(result.businessId);
      return result;
    },
  );
}

export async function activateControlCenterTenantAction(businessId: string) {
  return protectedControlCenterAction(
    PERMISSION_CODES.CONTROL_CENTER_TENANTS_EDIT,
    async ({ operator }) => {
      const result = await runControlCenterTenantLifecycleAction(operator, businessId, "activate");
      revalidateTenantPages(businessId);
      return result;
    },
  );
}

export async function suspendControlCenterTenantAction(businessId: string) {
  return protectedControlCenterAction(
    PERMISSION_CODES.CONTROL_CENTER_TENANTS_SUSPEND,
    async ({ operator }) => {
      const result = await runControlCenterTenantLifecycleAction(operator, businessId, "suspend");
      revalidateTenantPages(businessId);
      return result;
    },
  );
}

export async function reactivateControlCenterTenantAction(businessId: string) {
  return protectedControlCenterAction(
    PERMISSION_CODES.CONTROL_CENTER_TENANTS_SUSPEND,
    async ({ operator }) => {
      const result = await runControlCenterTenantLifecycleAction(
        operator,
        businessId,
        "reactivate",
      );
      revalidateTenantPages(businessId);
      return result;
    },
  );
}

export async function archiveControlCenterTenantAction(businessId: string) {
  return protectedControlCenterAction(
    PERMISSION_CODES.CONTROL_CENTER_TENANTS_EDIT,
    async ({ operator }) => {
      const result = await runControlCenterTenantLifecycleAction(operator, businessId, "archive");
      revalidateTenantPages(businessId);
      return result;
    },
  );
}

export async function deleteControlCenterTenantAction(businessId: string) {
  return protectedControlCenterAction(
    PERMISSION_CODES.CONTROL_CENTER_TENANTS_DELETE,
    async ({ operator }) => {
      const result = await runControlCenterTenantLifecycleAction(operator, businessId, "delete");
      revalidateTenantPages(businessId);
      return result;
    },
  );
}

export async function setControlCenterTenantMaintenanceAction(
  businessId: string,
  mode: TenantMaintenanceMode,
  scheduledAt?: string | null,
) {
  return protectedControlCenterAction(
    PERMISSION_CODES.CONTROL_CENTER_TENANTS_MAINTENANCE,
    async ({ operator }) => {
      await runControlCenterTenantMaintenanceAction(
        operator,
        businessId,
        mode,
        scheduledAt ? new Date(scheduledAt) : null,
      );
      revalidateTenantPages(businessId);
    },
  );
}

export async function refreshControlCenterTenantResourcesAction(businessId: string) {
  return protectedControlCenterAction(
    PERMISSION_CODES.CONTROL_CENTER_TENANTS_RESOURCES,
    async ({ operator }) => {
      await runControlCenterTenantResourceRefresh(operator, businessId);
      revalidateTenantPages(businessId);
    },
  );
}

export async function updateControlCenterTenantResourceLimitsAction(
  input: ControlCenterTenantResourceLimitsInput,
) {
  return protectedControlCenterAction(
    PERMISSION_CODES.CONTROL_CENTER_TENANTS_RESOURCES,
    async ({ operator }) => {
      await runControlCenterTenantResourceLimitsUpdate(operator, input.businessId, {
        maxUsers: input.maxUsers,
        maxBranches: input.maxBranches,
        maxStorageBytes: input.maxStorageBytes,
        maxApiCallsPerMonth: input.maxApiCallsPerMonth,
        maxAiTokensPerMonth: input.maxAiTokensPerMonth,
        maxDatabaseRows: input.maxDatabaseRows,
        maxMarketplaceLicenses: input.maxMarketplaceLicenses,
      });
      revalidateTenantPages(input.businessId);
    },
  );
}

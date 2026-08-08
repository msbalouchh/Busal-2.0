"use server";

import { revalidatePath } from "next/cache";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedControlCenterAction } from "@/modules/control-center/guards/control-center.guards";
import { CONTROL_CENTER_BUSINESS_ROUTES } from "@/modules/control-center/businesses/constants/control-center-businesses";
import type {
  ControlCenterBusinessBulkActionInput,
  ControlCenterBusinessDirectoryQuery,
  TransferControlCenterBusinessOwnershipInput,
  UpdateControlCenterBusinessInput,
} from "@/modules/control-center/businesses/types/control-center-businesses-types";
import {
  exportControlCenterBusinessesCsv,
  getControlCenterBusinessDetailForDrawer,
  queryControlCenterBusinessDirectory,
  runControlCenterBusinessBulkAction,
  runControlCenterBusinessLifecycleAction,
  transferControlCenterBusinessOwnership,
  updateControlCenterBusiness,
} from "@/services/control-center-businesses.service";

function revalidateBusinessPages(businessId?: string) {
  revalidatePath(CONTROL_CENTER_BUSINESS_ROUTES.directory);
  if (businessId) {
    revalidatePath(CONTROL_CENTER_BUSINESS_ROUTES.detail(businessId));
  }
}

export async function queryControlCenterBusinessesAction(
  query: ControlCenterBusinessDirectoryQuery,
) {
  return protectedControlCenterAction(PERMISSION_CODES.CONTROL_CENTER_BUSINESSES, async () =>
    queryControlCenterBusinessDirectory(query),
  );
}

export async function getControlCenterBusinessDetailAction(businessId: string) {
  return protectedControlCenterAction(PERMISSION_CODES.CONTROL_CENTER_BUSINESSES, async ({
    operator,
  }) => getControlCenterBusinessDetailForDrawer(operator, businessId));
}

export async function updateControlCenterBusinessAction(input: UpdateControlCenterBusinessInput) {
  return protectedControlCenterAction(
    PERMISSION_CODES.CONTROL_CENTER_BUSINESSES_EDIT,
    async ({ operator }) => {
      const result = await updateControlCenterBusiness(operator, input);
      revalidateBusinessPages(input.businessId);
      return result;
    },
  );
}

export async function activateControlCenterBusinessAction(businessId: string) {
  return protectedControlCenterAction(
    PERMISSION_CODES.CONTROL_CENTER_BUSINESSES_EDIT,
    async ({ operator }) => {
      const result = await runControlCenterBusinessLifecycleAction(
        operator,
        businessId,
        "activate",
      );
      revalidateBusinessPages(businessId);
      return result;
    },
  );
}

export async function suspendControlCenterBusinessAction(businessId: string) {
  return protectedControlCenterAction(
    PERMISSION_CODES.CONTROL_CENTER_BUSINESSES_SUSPEND,
    async ({ operator }) => {
      const result = await runControlCenterBusinessLifecycleAction(
        operator,
        businessId,
        "suspend",
      );
      revalidateBusinessPages(businessId);
      return result;
    },
  );
}

export async function archiveControlCenterBusinessAction(businessId: string) {
  return protectedControlCenterAction(
    PERMISSION_CODES.CONTROL_CENTER_BUSINESSES_EDIT,
    async ({ operator }) => {
      const result = await runControlCenterBusinessLifecycleAction(
        operator,
        businessId,
        "archive",
      );
      revalidateBusinessPages(businessId);
      return result;
    },
  );
}

export async function deleteControlCenterBusinessAction(businessId: string) {
  return protectedControlCenterAction(
    PERMISSION_CODES.CONTROL_CENTER_BUSINESSES_DELETE,
    async ({ operator }) => {
      const result = await runControlCenterBusinessLifecycleAction(
        operator,
        businessId,
        "delete",
      );
      revalidateBusinessPages(businessId);
      return result;
    },
  );
}

export async function transferControlCenterBusinessOwnershipAction(
  input: TransferControlCenterBusinessOwnershipInput,
) {
  return protectedControlCenterAction(
    PERMISSION_CODES.CONTROL_CENTER_BUSINESSES_TRANSFER,
    async ({ operator }) => {
      const result = await transferControlCenterBusinessOwnership(operator, input);
      revalidateBusinessPages(input.businessId);
      return result;
    },
  );
}

export async function bulkControlCenterBusinessAction(input: ControlCenterBusinessBulkActionInput) {
  return protectedControlCenterAction(
    PERMISSION_CODES.CONTROL_CENTER_BUSINESSES_EDIT,
    async ({ operator }) => {
      const result = await runControlCenterBusinessBulkAction(operator, input);
      revalidateBusinessPages();
      return result;
    },
  );
}

export async function exportControlCenterBusinessesCsvAction(
  query: ControlCenterBusinessDirectoryQuery,
) {
  return protectedControlCenterAction(PERMISSION_CODES.CONTROL_CENTER_BUSINESSES, async ({
    operator,
  }) => exportControlCenterBusinessesCsv(operator, query));
}

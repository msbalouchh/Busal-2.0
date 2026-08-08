"use server";

import { revalidatePath } from "next/cache";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedControlCenterAction } from "@/modules/control-center/guards/control-center.guards";
import { CONTROL_CENTER_OPERATOR_ROUTES } from "@/modules/control-center/operators/constants/control-center-operators";
import type {
  AssignControlCenterOperatorRoleInput,
  ControlCenterOperatorBulkActionInput,
  ControlCenterOperatorDirectoryQuery,
  CreateControlCenterOperatorInput,
  ManageControlCenterOperatorPermissionsInput,
  UpdateControlCenterOperatorInput,
} from "@/modules/control-center/operators/types/control-center-operators-types";
import {
  activateControlCenterOperator,
  assignControlCenterOperatorRole,
  createControlCenterOperator,
  deleteControlCenterOperator,
  exportControlCenterOperatorsCsv,
  forceLogoutControlCenterOperator,
  getControlCenterOperatorDetailBundle,
  manageControlCenterOperatorPermissions,
  queryControlCenterOperatorDirectory,
  resetControlCenterOperatorPassword,
  runControlCenterOperatorBulkAction,
  suspendControlCenterOperator,
  updateControlCenterOperator,
} from "@/services/control-center-operators.service";

function revalidateOperatorPages(operatorId?: string) {
  revalidatePath(CONTROL_CENTER_OPERATOR_ROUTES.directory);
  if (operatorId) {
    revalidatePath(CONTROL_CENTER_OPERATOR_ROUTES.detail(operatorId));
  }
}

export async function queryControlCenterOperatorsAction(query: ControlCenterOperatorDirectoryQuery) {
  return protectedControlCenterAction(PERMISSION_CODES.CONTROL_CENTER_OPERATORS, async () =>
    queryControlCenterOperatorDirectory(query),
  );
}

export async function getControlCenterOperatorDetailAction(operatorId: string) {
  return protectedControlCenterAction(PERMISSION_CODES.CONTROL_CENTER_OPERATORS, async ({
    operator,
  }) => {
    const bundle = await getControlCenterOperatorDetailBundle(operator, operatorId);
    return bundle.profile;
  });
}

export async function createControlCenterOperatorAction(input: CreateControlCenterOperatorInput) {
  return protectedControlCenterAction(PERMISSION_CODES.CONTROL_CENTER_OPERATORS, async ({
    operator,
  }) => {
    const profile = await createControlCenterOperator(operator, input);
    revalidateOperatorPages(profile.id);
    return profile;
  });
}

export async function updateControlCenterOperatorAction(input: UpdateControlCenterOperatorInput) {
  return protectedControlCenterAction(PERMISSION_CODES.CONTROL_CENTER_OPERATORS_EDIT, async ({
    operator,
  }) => {
    const profile = await updateControlCenterOperator(operator, input);
    revalidateOperatorPages(profile.id);
    return profile;
  });
}

export async function assignControlCenterOperatorRoleAction(
  input: AssignControlCenterOperatorRoleInput,
) {
  return protectedControlCenterAction(PERMISSION_CODES.CONTROL_CENTER_OPERATORS_ROLES, async ({
    operator,
  }) => {
    const profile = await assignControlCenterOperatorRole(operator, input);
    revalidateOperatorPages(profile.id);
    return profile;
  });
}

export async function manageControlCenterOperatorPermissionsAction(
  input: ManageControlCenterOperatorPermissionsInput,
) {
  return protectedControlCenterAction(
    PERMISSION_CODES.CONTROL_CENTER_OPERATORS_PERMISSIONS,
    async ({ operator }) => {
      const profile = await manageControlCenterOperatorPermissions(operator, input);
      revalidateOperatorPages(profile.id);
      return profile;
    },
  );
}

export async function suspendControlCenterOperatorAction(operatorId: string) {
  return protectedControlCenterAction(PERMISSION_CODES.CONTROL_CENTER_OPERATORS_SUSPEND, async ({
    operator,
  }) => {
    const profile = await suspendControlCenterOperator(operator, operatorId);
    revalidateOperatorPages(operatorId);
    return profile;
  });
}

export async function activateControlCenterOperatorAction(operatorId: string) {
  return protectedControlCenterAction(PERMISSION_CODES.CONTROL_CENTER_OPERATORS_EDIT, async ({
    operator,
  }) => {
    const profile = await activateControlCenterOperator(operator, operatorId);
    revalidateOperatorPages(operatorId);
    return profile;
  });
}

export async function deleteControlCenterOperatorAction(operatorId: string) {
  return protectedControlCenterAction(PERMISSION_CODES.CONTROL_CENTER_OPERATORS_DELETE, async ({
    operator,
  }) => {
    await deleteControlCenterOperator(operator, operatorId);
    revalidateOperatorPages();
  });
}

export async function resetControlCenterOperatorPasswordAction(operatorId: string) {
  return protectedControlCenterAction(PERMISSION_CODES.CONTROL_CENTER_OPERATORS_EDIT, async ({
    operator,
  }) => {
    await resetControlCenterOperatorPassword(operator, operatorId);
    revalidateOperatorPages(operatorId);
  });
}

export async function forceLogoutControlCenterOperatorAction(operatorId: string) {
  return protectedControlCenterAction(PERMISSION_CODES.CONTROL_CENTER_OPERATORS_EDIT, async ({
    operator,
  }) => {
    const count = await forceLogoutControlCenterOperator(operator, operatorId);
    revalidateOperatorPages(operatorId);
    return count;
  });
}

export async function bulkControlCenterOperatorAction(input: ControlCenterOperatorBulkActionInput) {
  return protectedControlCenterAction(PERMISSION_CODES.CONTROL_CENTER_OPERATORS_EDIT, async ({
    operator,
  }) => {
    const result = await runControlCenterOperatorBulkAction(operator, input);
    revalidateOperatorPages();
    return result;
  });
}

export async function exportControlCenterOperatorsCsvAction(
  query: ControlCenterOperatorDirectoryQuery,
) {
  return protectedControlCenterAction(PERMISSION_CODES.CONTROL_CENTER_OPERATORS, async ({
    operator,
  }) => exportControlCenterOperatorsCsv(operator, query));
}

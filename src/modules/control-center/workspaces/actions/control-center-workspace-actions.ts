"use server";

import { revalidatePath } from "next/cache";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedControlCenterAction } from "@/modules/control-center/guards/control-center.guards";
import { CONTROL_CENTER_WORKSPACE_ROUTES } from "@/modules/control-center/workspaces/constants/control-center-workspaces";
import type {
  ControlCenterWorkspaceBulkActionInput,
  ControlCenterWorkspaceDirectoryQuery,
  TransferControlCenterWorkspaceOwnershipInput,
  UpdateControlCenterWorkspaceInput,
} from "@/modules/control-center/workspaces/types/control-center-workspaces-types";
import { resolveBusinessIdFromWorkspaceId } from "@/modules/control-center/workspaces/utils/workspace-ids";
import {
  exportControlCenterWorkspacesCsv,
  getControlCenterWorkspaceDetailForDrawer,
  queryControlCenterWorkspaceDirectory,
  runControlCenterWorkspaceBulkAction,
  runControlCenterWorkspaceLifecycleAction,
  transferControlCenterWorkspaceOwnership,
  updateControlCenterWorkspace,
} from "@/services/control-center-workspaces.service";

function revalidateWorkspacePages(workspaceId?: string) {
  revalidatePath(CONTROL_CENTER_WORKSPACE_ROUTES.directory);
  if (workspaceId) {
    revalidatePath(CONTROL_CENTER_WORKSPACE_ROUTES.detail(workspaceId));
  }
}

export async function queryControlCenterWorkspacesAction(
  query: ControlCenterWorkspaceDirectoryQuery,
) {
  return protectedControlCenterAction(PERMISSION_CODES.CONTROL_CENTER_WORKSPACES, async () =>
    queryControlCenterWorkspaceDirectory(query),
  );
}

export async function getControlCenterWorkspaceDetailAction(workspaceId: string) {
  return protectedControlCenterAction(PERMISSION_CODES.CONTROL_CENTER_WORKSPACES, async ({
    operator,
  }) => getControlCenterWorkspaceDetailForDrawer(operator, workspaceId));
}

export async function updateControlCenterWorkspaceAction(input: UpdateControlCenterWorkspaceInput) {
  return protectedControlCenterAction(
    PERMISSION_CODES.CONTROL_CENTER_WORKSPACES_EDIT,
    async ({ operator }) => {
      const result = await updateControlCenterWorkspace(operator, input);
      revalidateWorkspacePages(input.workspaceId);
      return result;
    },
  );
}

export async function activateControlCenterWorkspaceAction(workspaceId: string) {
  return protectedControlCenterAction(
    PERMISSION_CODES.CONTROL_CENTER_WORKSPACES_EDIT,
    async ({ operator }) => {
      const result = await runControlCenterWorkspaceLifecycleAction(
        operator,
        workspaceId,
        "activate",
      );
      revalidateWorkspacePages(workspaceId);
      return result;
    },
  );
}

export async function suspendControlCenterWorkspaceAction(workspaceId: string) {
  return protectedControlCenterAction(
    PERMISSION_CODES.CONTROL_CENTER_WORKSPACES_SUSPEND,
    async ({ operator }) => {
      const result = await runControlCenterWorkspaceLifecycleAction(
        operator,
        workspaceId,
        "suspend",
      );
      revalidateWorkspacePages(workspaceId);
      return result;
    },
  );
}

export async function archiveControlCenterWorkspaceAction(workspaceId: string) {
  return protectedControlCenterAction(
    PERMISSION_CODES.CONTROL_CENTER_WORKSPACES_EDIT,
    async ({ operator }) => {
      const result = await runControlCenterWorkspaceLifecycleAction(
        operator,
        workspaceId,
        "archive",
      );
      revalidateWorkspacePages(workspaceId);
      return result;
    },
  );
}

export async function deleteControlCenterWorkspaceAction(workspaceId: string) {
  return protectedControlCenterAction(
    PERMISSION_CODES.CONTROL_CENTER_WORKSPACES_DELETE,
    async ({ operator }) => {
      const result = await runControlCenterWorkspaceLifecycleAction(
        operator,
        workspaceId,
        "delete",
      );
      revalidateWorkspacePages(workspaceId);
      return result;
    },
  );
}

export async function transferControlCenterWorkspaceOwnershipAction(
  input: TransferControlCenterWorkspaceOwnershipInput,
) {
  return protectedControlCenterAction(
    PERMISSION_CODES.CONTROL_CENTER_WORKSPACES_TRANSFER,
    async ({ operator }) => {
      const result = await transferControlCenterWorkspaceOwnership(operator, input);
      revalidateWorkspacePages(input.workspaceId);
      return result;
    },
  );
}

export async function bulkControlCenterWorkspaceAction(input: ControlCenterWorkspaceBulkActionInput) {
  return protectedControlCenterAction(
    PERMISSION_CODES.CONTROL_CENTER_WORKSPACES_EDIT,
    async ({ operator }) => {
      const result = await runControlCenterWorkspaceBulkAction(operator, input);
      revalidateWorkspacePages();
      return result;
    },
  );
}

export async function exportControlCenterWorkspacesCsvAction(
  query: ControlCenterWorkspaceDirectoryQuery,
) {
  return protectedControlCenterAction(PERMISSION_CODES.CONTROL_CENTER_WORKSPACES, async ({
    operator,
  }) => exportControlCenterWorkspacesCsv(operator, query));
}

export async function resolveWorkspaceBusinessIdAction(workspaceId: string) {
  return resolveBusinessIdFromWorkspaceId(workspaceId);
}

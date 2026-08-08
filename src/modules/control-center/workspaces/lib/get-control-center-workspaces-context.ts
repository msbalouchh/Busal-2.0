import "server-only";

import { cache } from "react";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedControlCenterPage } from "@/modules/control-center/guards/control-center.guards";
import type { ControlCenterWorkspaceDirectoryQuery } from "@/modules/control-center/workspaces/types/control-center-workspaces-types";
import {
  getControlCenterWorkspaceDetailBundle,
  getControlCenterWorkspaceManagementBundle,
} from "@/services/control-center-workspaces.service";

export const getControlCenterWorkspacesContext = cache(
  async (query: ControlCenterWorkspaceDirectoryQuery = {}) => {
    const operator = await protectedControlCenterPage({
      permission: PERMISSION_CODES.CONTROL_CENTER_WORKSPACES,
    });

    return getControlCenterWorkspaceManagementBundle(operator, query);
  },
);

export const getControlCenterWorkspaceDetailContext = cache(async (workspaceId: string) => {
  const operator = await protectedControlCenterPage({
    permission: PERMISSION_CODES.CONTROL_CENTER_WORKSPACES,
  });

  return getControlCenterWorkspaceDetailBundle(operator, workspaceId);
});

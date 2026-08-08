import "server-only";

import { cache } from "react";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedControlCenterPage } from "@/modules/control-center/guards/control-center.guards";
import type { ControlCenterOperatorDirectoryQuery } from "@/modules/control-center/operators/types/control-center-operators-types";
import {
  getControlCenterOperatorDetailBundle,
  getControlCenterOperatorManagementBundle,
} from "@/services/control-center-operators.service";

export const getControlCenterOperatorsContext = cache(
  async (query: ControlCenterOperatorDirectoryQuery = {}) => {
    const operator = await protectedControlCenterPage({
      permission: PERMISSION_CODES.CONTROL_CENTER_OPERATORS,
    });

    return getControlCenterOperatorManagementBundle(operator, query);
  },
);

export const getControlCenterOperatorDetailContext = cache(async (operatorId: string) => {
  const operator = await protectedControlCenterPage({
    permission: PERMISSION_CODES.CONTROL_CENTER_OPERATORS,
  });

  return getControlCenterOperatorDetailBundle(operator, operatorId);
});

import "server-only";

import { cache } from "react";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedControlCenterPage } from "@/modules/control-center/guards/control-center.guards";
import type {
  ControlCenterAlertQuery,
  ControlCenterIncidentQuery,
  ControlCenterLogQuery,
} from "@/modules/control-center/monitoring/types/control-center-monitoring-types";
import { getControlCenterMonitoringManagementBundle } from "@/services/control-center-monitoring.service";

export const getControlCenterMonitoringContext = cache(
  async (
    logQuery: ControlCenterLogQuery = {},
    alertQuery: ControlCenterAlertQuery = {},
    incidentQuery: ControlCenterIncidentQuery = {},
  ) => {
    const operator = await protectedControlCenterPage({
      permission: PERMISSION_CODES.CONTROL_CENTER_MONITORING,
    });

    return getControlCenterMonitoringManagementBundle(
      operator,
      logQuery,
      alertQuery,
      incidentQuery,
    );
  },
);

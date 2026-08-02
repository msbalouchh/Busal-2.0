"use server";

import { revalidatePath } from "next/cache";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedControlCenterAction } from "@/modules/control-center/guards/control-center.guards";
import { CONTROL_CENTER_MONITORING_ROUTES } from "@/modules/control-center/monitoring/constants/control-center-monitoring";
import type {
  ControlCenterAlertQuery,
  ControlCenterIncidentQuery,
  ControlCenterLogQuery,
} from "@/modules/control-center/monitoring/types/control-center-monitoring-types";
import {
  exportControlCenterLogs,
  getControlCenterMonitoringManagementBundle,
  queryControlCenterAlerts,
  queryControlCenterIncidents,
  queryControlCenterLogs,
  runControlCenterAcknowledgeAlert,
  runControlCenterEscalateAlert,
  runControlCenterResolveAlert,
  runControlCenterResolveIncident,
} from "@/services/control-center-monitoring.service";

function revalidateMonitoringPages() {
  revalidatePath(CONTROL_CENTER_MONITORING_ROUTES.overview);
}

export async function refreshControlCenterMonitoringBundleAction(
  logQuery: ControlCenterLogQuery = {},
  alertQuery: ControlCenterAlertQuery = {},
  incidentQuery: ControlCenterIncidentQuery = {},
) {
  return protectedControlCenterAction(
    PERMISSION_CODES.CONTROL_CENTER_MONITORING,
    async ({ operator }) =>
      getControlCenterMonitoringManagementBundle(operator, logQuery, alertQuery, incidentQuery),
  );
}

export async function queryControlCenterAlertsAction(query: ControlCenterAlertQuery) {
  return protectedControlCenterAction(PERMISSION_CODES.CONTROL_CENTER_MONITORING, async () =>
    queryControlCenterAlerts(query),
  );
}

export async function queryControlCenterLogsAction(query: ControlCenterLogQuery) {
  return protectedControlCenterAction(PERMISSION_CODES.CONTROL_CENTER_MONITORING, async () =>
    queryControlCenterLogs(query),
  );
}

export async function queryControlCenterIncidentsAction(query: ControlCenterIncidentQuery) {
  return protectedControlCenterAction(PERMISSION_CODES.CONTROL_CENTER_MONITORING, async () =>
    queryControlCenterIncidents(query),
  );
}

export async function exportControlCenterLogsAction(query: ControlCenterLogQuery) {
  return protectedControlCenterAction(PERMISSION_CODES.CONTROL_CENTER_MONITORING, async () =>
    exportControlCenterLogs(query),
  );
}

export async function acknowledgeControlCenterAlertAction(alertId: string) {
  return protectedControlCenterAction(
    PERMISSION_CODES.CONTROL_CENTER_MONITORING,
    async ({ operator }) => {
      await runControlCenterAcknowledgeAlert(operator, alertId);
      revalidateMonitoringPages();
    },
  );
}

export async function resolveControlCenterAlertAction(alertId: string) {
  return protectedControlCenterAction(
    PERMISSION_CODES.CONTROL_CENTER_MONITORING,
    async ({ operator }) => {
      await runControlCenterResolveAlert(operator, alertId);
      revalidateMonitoringPages();
    },
  );
}

export async function escalateControlCenterAlertAction(alertId: string) {
  return protectedControlCenterAction(
    PERMISSION_CODES.CONTROL_CENTER_MONITORING,
    async ({ operator }) => {
      await runControlCenterEscalateAlert(operator, alertId);
      revalidateMonitoringPages();
    },
  );
}

export async function resolveControlCenterIncidentAction(incidentId: string, rootCause?: string) {
  return protectedControlCenterAction(
    PERMISSION_CODES.CONTROL_CENTER_MONITORING,
    async ({ operator }) => {
      await runControlCenterResolveIncident(operator, incidentId, rootCause);
      revalidateMonitoringPages();
    },
  );
}

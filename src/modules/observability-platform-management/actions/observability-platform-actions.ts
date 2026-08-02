"use server";

import { revalidatePath } from "next/cache";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { OBSERVABILITY_PLATFORM_ROUTES } from "@/modules/observability-platform-management/constants/routes";
import { requireObservabilityPlatformActionContext } from "@/modules/observability-platform-management/lib/get-observability-platform-context";
import {
  validateAlertName,
  validateIncidentTitle,
} from "@/modules/observability-platform-management/lib/observability-platform-validation";
import {
  acknowledgeAlert,
  createAlert,
  resolveAlert,
} from "@/services/platform-alert-manager.service";
import {
  assignIncident,
  createIncident,
  updateIncidentStatus,
} from "@/services/platform-incident-manager.service";
import { recordMetric } from "@/services/platform-metrics.service";
import { writePlatformLog } from "@/services/platform-logging.service";
import { recordTraceSpan } from "@/services/platform-tracing.service";
import {
  notifyAlertTriggered,
  notifyIncidentOpened,
} from "@/services/platform-observability-notification.service";
import { writeAuditEvent } from "@/services/platform-audit-aggregator.service";

function revalidateObservabilityPages(): void {
  for (const route of [
    OBSERVABILITY_PLATFORM_ROUTES.dashboard(),
    OBSERVABILITY_PLATFORM_ROUTES.metrics(),
    OBSERVABILITY_PLATFORM_ROUTES.logs(),
    OBSERVABILITY_PLATFORM_ROUTES.incidents(),
    OBSERVABILITY_PLATFORM_ROUTES.alerts(),
    OBSERVABILITY_PLATFORM_ROUTES.health(),
    OBSERVABILITY_PLATFORM_ROUTES.performance(),
    OBSERVABILITY_PLATFORM_ROUTES.traces(),
    OBSERVABILITY_PLATFORM_ROUTES.audit(),
    OBSERVABILITY_PLATFORM_ROUTES.search(),
  ]) {
    revalidatePath(route);
  }
}

export async function createIncidentAction(input: {
  title: string;
  description?: string;
  severity?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}) {
  const context = await requireObservabilityPlatformActionContext(PERMISSION_CODES.INCIDENT_MANAGE);
  const incident = await createIncident(context.user.id, {
    title: validateIncidentTitle(input.title),
    description: input.description,
    severity: input.severity,
  });
  await notifyIncidentOpened(context.user.id, {
    title: incident.title,
    severity: incident.severity,
  });
  await writeAuditEvent(context.user.id, {
    service: "observability-platform",
    action: "incident.created",
    message: `Incident opened: ${incident.title}`,
  });
  revalidateObservabilityPages();
  return { id: incident.id };
}

export async function updateIncidentStatusAction(
  incidentId: string,
  status: "OPEN" | "INVESTIGATING" | "RESOLVED" | "CLOSED",
) {
  const context = await requireObservabilityPlatformActionContext(PERMISSION_CODES.INCIDENT_MANAGE);
  await updateIncidentStatus(context.user.id, incidentId, status);
  revalidateObservabilityPages();
}

export async function assignIncidentAction(incidentId: string, assignedTo: string) {
  const context = await requireObservabilityPlatformActionContext(PERMISSION_CODES.INCIDENT_MANAGE);
  await assignIncident(context.user.id, incidentId, assignedTo);
  revalidateObservabilityPages();
}

export async function createAlertAction(input: {
  name: string;
  condition?: string;
  severity?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}) {
  const context = await requireObservabilityPlatformActionContext(PERMISSION_CODES.ALERTS_MANAGE);
  const alert = await createAlert(context.user.id, {
    name: validateAlertName(input.name),
    condition: input.condition,
    severity: input.severity,
  });
  await notifyAlertTriggered(context.user.id, {
    name: alert.name,
    severity: alert.severity,
  });
  revalidateObservabilityPages();
  return { id: alert.id };
}

export async function acknowledgeAlertAction(alertId: string) {
  const context = await requireObservabilityPlatformActionContext(PERMISSION_CODES.ALERTS_MANAGE);
  await acknowledgeAlert(context.user.id, alertId);
  revalidateObservabilityPages();
}

export async function resolveAlertAction(alertId: string) {
  const context = await requireObservabilityPlatformActionContext(PERMISSION_CODES.ALERTS_MANAGE);
  await resolveAlert(context.user.id, alertId);
  revalidateObservabilityPages();
}

export async function recordTelemetryAction(input: {
  service: string;
  metric: string;
  value: number;
  unit?: string;
  message?: string;
}) {
  const context = await requireObservabilityPlatformActionContext(
    PERMISSION_CODES.OBSERVABILITY_MANAGE,
  );
  await recordMetric(context.user.id, input);
  if (input.message) {
    await writePlatformLog(context.user.id, {
      service: input.service,
      message: input.message,
      category: "telemetry",
    });
  }
  revalidateObservabilityPages();
}

export async function recordTraceAction(input: {
  traceId: string;
  spanId: string;
  service: string;
  operation: string;
  durationMs: number;
}) {
  const context = await requireObservabilityPlatformActionContext(
    PERMISSION_CODES.OBSERVABILITY_MANAGE,
  );
  await recordTraceSpan(context.user.id, input);
  revalidateObservabilityPages();
}

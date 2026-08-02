import "server-only";

import { writePlatformLog } from "@/services/platform-logging.service";

export interface ObservabilityNotification {
  channel: "in-app" | "communication-platform";
  title: string;
  body: string;
  severity: "low" | "medium" | "high" | "critical";
}

export async function dispatchObservabilityNotification(
  ownerId: string,
  notification: ObservabilityNotification,
): Promise<{ dispatched: boolean; channel: string }> {
  await writePlatformLog(ownerId, {
    service: "observability-platform",
    level: notification.severity === "critical" ? "CRITICAL" : "INFO",
    category: "notification",
    message: notification.title,
    metadata: {
      body: notification.body,
      channel: notification.channel,
      severity: notification.severity,
    },
  });

  return { dispatched: true, channel: notification.channel };
}

export async function notifyAlertTriggered(
  ownerId: string,
  alert: { name: string; severity: string },
) {
  return dispatchObservabilityNotification(ownerId, {
    channel: "in-app",
    title: `Alert: ${alert.name}`,
    body: `Severity ${alert.severity} alert triggered.`,
    severity: alert.severity === "CRITICAL" ? "critical" : "high",
  });
}

export async function notifyIncidentOpened(
  ownerId: string,
  incident: { title: string; severity: string },
) {
  return dispatchObservabilityNotification(ownerId, {
    channel: "in-app",
    title: `Incident: ${incident.title}`,
    body: `New ${incident.severity} severity incident opened.`,
    severity: incident.severity === "CRITICAL" ? "critical" : "medium",
  });
}

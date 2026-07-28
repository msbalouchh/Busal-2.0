import type { MonitoringAlertChannel, MonitoringAlertType } from "@prisma/client";

export function resolveAlertChannels(
  channels?: MonitoringAlertChannel[],
): MonitoringAlertChannel[] {
  if (!channels || channels.length === 0) {
    return ["IN_APP"];
  }

  return channels;
}

export function buildAlertDeliveryPayload(input: {
  alertType: MonitoringAlertType;
  title: string;
  message: string;
  businessId: string;
}): Record<string, unknown> {
  return {
    alertType: input.alertType,
    title: input.title,
    message: input.message,
    businessId: input.businessId,
    deliveredAt: new Date().toISOString(),
  };
}

export function shouldDeliverToChannel(
  channel: MonitoringAlertChannel,
  enabledChannels: MonitoringAlertChannel[],
): boolean {
  return enabledChannels.includes(channel);
}

export function formatAlertTitle(alertType: MonitoringAlertType): string {
  return alertType
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

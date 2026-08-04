import type { DeliveryStatus } from "@/modules/notifications/constants/notification-status";
import type {
  NotificationDelivery,
  NotificationQueue,
} from "@/modules/notifications/types/notification-platform";

export function canRetry(queueItem: NotificationQueue): boolean {
  return queueItem.retryCount < queueItem.maxRetries;
}

export function getNextRetryDelayMs(retryCount: number): number {
  const baseDelay = 60_000;
  return baseDelay * Math.pow(2, retryCount);
}

export function isDeliverySuccessful(status: DeliveryStatus): boolean {
  return status === "delivered";
}

export function isDeliveryFailed(status: DeliveryStatus): boolean {
  return status === "failed" || status === "bounced";
}

export function getDeliverySuccessRate(deliveries: NotificationDelivery[]): number {
  if (deliveries.length === 0) {
    return 0;
  }

  const successful = deliveries.filter((d) => isDeliverySuccessful(d.status)).length;
  return Math.round((successful / deliveries.length) * 10000) / 100;
}

export function getAverageDeliveryTimeMs(deliveries: NotificationDelivery[]): number {
  const delivered = deliveries.filter((d) => d.deliveredAt !== null);

  if (delivered.length === 0) {
    return 0;
  }

  const totalMs = delivered.reduce((sum, d) => {
    const created = new Date(d.createdAt).getTime();
    const deliveredAt = new Date(d.deliveredAt!).getTime();
    return sum + (deliveredAt - created);
  }, 0);

  return Math.round(totalMs / delivered.length);
}

export function getPendingQueueCount(queue: NotificationQueue[]): number {
  return queue.filter((q) => q.status === "pending" || q.status === "retry").length;
}

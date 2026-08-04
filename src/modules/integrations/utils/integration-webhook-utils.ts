import type { WebhookEvent } from "@/modules/integrations/types/integration-platform";

export function canRetryWebhookEvent(event: WebhookEvent, maxRetries = 3): boolean {
  return event.attemptCount < maxRetries && event.status !== "delivered";
}

export function getRetryDelayMs(attemptCount: number, baseDelayMs = 5000): number {
  return baseDelayMs * Math.pow(2, attemptCount);
}

export function isWebhookDelivered(event: WebhookEvent): boolean {
  return event.status === "delivered";
}

export function isWebhookFailed(event: WebhookEvent): boolean {
  return event.status === "failed";
}

export function getNextRetryAt(
  attemptCount: number,
  baseDelayMs = 5000,
  fromDate = new Date(),
): string {
  const delayMs = getRetryDelayMs(attemptCount, baseDelayMs);
  return new Date(fromDate.getTime() + delayMs).toISOString();
}

export function suggestRetryAction(event: WebhookEvent): string {
  if (event.responseStatusCode === 503) {
    return "Endpoint temporarily unavailable — retry with exponential backoff";
  }

  if (event.responseStatusCode === 500) {
    return "Server error on receiver — retry after 30 seconds";
  }

  if (event.responseStatusCode === 429) {
    return "Rate limited by receiver — retry after retry-after header duration";
  }

  return "Review webhook endpoint configuration and retry";
}

export function getPendingRetryEvents(events: WebhookEvent[]): WebhookEvent[] {
  return events.filter((e) => e.status === "retrying" || e.status === "failed");
}

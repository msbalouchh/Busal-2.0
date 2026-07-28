import type { AiAgentScheduleType } from "@prisma/client";

export function computeNextRunAt(
  scheduleType: AiAgentScheduleType,
  from: Date = new Date(),
): Date | null {
  const next = new Date(from);

  switch (scheduleType) {
    case "CONTINUOUS":
      return next;
    case "HOURLY":
      next.setHours(next.getHours() + 1, 0, 0, 0);
      return next;
    case "DAILY":
      next.setDate(next.getDate() + 1);
      next.setHours(9, 0, 0, 0);
      return next;
    case "WEEKLY":
      next.setDate(next.getDate() + 7);
      next.setHours(9, 0, 0, 0);
      return next;
    case "MONTHLY":
      next.setMonth(next.getMonth() + 1);
      next.setHours(9, 0, 0, 0);
      return next;
    case "EVENT_DRIVEN":
    case "MANUAL":
      return null;
    default:
      return null;
  }
}

export function isScheduleDue(
  scheduleType: AiAgentScheduleType,
  lastRunAt: Date | null,
  nextRunAt: Date | null,
  now: Date = new Date(),
): boolean {
  if (scheduleType === "MANUAL" || scheduleType === "EVENT_DRIVEN") {
    return false;
  }

  if (scheduleType === "CONTINUOUS") {
    return true;
  }

  if (nextRunAt && nextRunAt <= now) {
    return true;
  }

  if (!lastRunAt) {
    return true;
  }

  return false;
}

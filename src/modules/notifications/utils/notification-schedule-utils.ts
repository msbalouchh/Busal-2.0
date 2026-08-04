import type { ScheduleType } from "@/modules/notifications/constants/notification-status";
import type { NotificationSchedule } from "@/modules/notifications/types/notification-platform";

export function isScheduleDue(schedule: NotificationSchedule, now = new Date()): boolean {
  if (!schedule.isActive) {
    return false;
  }

  const nextRun = new Date(schedule.nextRunAt);
  return nextRun <= now;
}

export function getNextRunAt(scheduleType: ScheduleType, fromDate: Date): string {
  const next = new Date(fromDate);

  switch (scheduleType) {
    case "daily":
      next.setDate(next.getDate() + 1);
      break;
    case "weekly":
      next.setDate(next.getDate() + 7);
      break;
    case "monthly":
      next.setMonth(next.getMonth() + 1);
      break;
    case "once":
    case "cron":
    default:
      break;
  }

  return next.toISOString();
}

export function isWithinQuietHours(
  quietStart: string | null,
  quietEnd: string | null,
  now = new Date(),
): boolean {
  if (!quietStart || !quietEnd) {
    return false;
  }

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const [startH, startM] = quietStart.split(":").map(Number);
  const [endH, endM] = quietEnd.split(":").map(Number);
  const startMinutes = (startH ?? 0) * 60 + (startM ?? 0);
  const endMinutes = (endH ?? 0) * 60 + (endM ?? 0);

  if (startMinutes <= endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  }

  return currentMinutes >= startMinutes || currentMinutes < endMinutes;
}

export function getActiveSchedules(schedules: NotificationSchedule[]): NotificationSchedule[] {
  return schedules.filter((s) => s.isActive);
}

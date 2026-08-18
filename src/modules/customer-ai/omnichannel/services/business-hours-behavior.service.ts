import "server-only";

import { listBusinessHours, type BusinessHoursData } from "@/services/business-management.service";
import type { ChannelAiSettings } from "@/modules/customer-ai/omnichannel/types/omnichannel.types";

function parseTimeToMinutes(time: string): number | null {
  const parts = time.split(":");
  const hours = Number(parts[0]);
  const minutes = Number(parts[1] ?? 0);
  if (!Number.isFinite(hours)) return null;
  return hours * 60 + (Number.isFinite(minutes) ? minutes : 0);
}

function isWithinBusinessHourEntry(now: Date, entry: BusinessHoursData): boolean {
  if (entry.isClosed || !entry.openTime || !entry.closeTime) return false;
  const openMinutes = parseTimeToMinutes(entry.openTime);
  const closeMinutes = parseTimeToMinutes(entry.closeTime);
  if (openMinutes === null || closeMinutes === null) return false;
  const minutes = now.getHours() * 60 + now.getMinutes();
  return minutes >= openMinutes && minutes <= closeMinutes;
}

export async function resolveBusinessHoursMessage(businessId: string): Promise<string | null> {
  const hours = await listBusinessHours(businessId);
  if (hours.length === 0) return null;

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const lines = hours.map((entry) => {
    const label = dayNames[entry.dayOfWeek] ?? `Day ${entry.dayOfWeek}`;
    return entry.isClosed || !entry.openTime || !entry.closeTime
      ? `${label}: Closed`
      : `${label}: ${entry.openTime} – ${entry.closeTime}`;
  });

  return `Our opening hours:\n${lines.join("\n")}`;
}

export async function isBusinessCurrentlyOpen(businessId: string, at = new Date()): Promise<boolean> {
  const hours = await listBusinessHours(businessId);
  if (hours.length === 0) return true;

  const todayEntries = hours.filter((entry) => entry.dayOfWeek === at.getDay());
  if (todayEntries.length === 0) return true;

  return todayEntries.some((entry) => isWithinBusinessHourEntry(at, entry));
}

export async function resolveOutsideHoursResponse(input: {
  businessId: string;
  settings: ChannelAiSettings;
}): Promise<{ shouldRespond: boolean; message?: string; escalate?: boolean }> {
  const open = await isBusinessCurrentlyOpen(input.businessId);
  if (open) return { shouldRespond: true };

  switch (input.settings.outsideHoursBehavior) {
    case "normal":
      return { shouldRespond: true };
    case "collect_request":
      return {
        shouldRespond: true,
        message:
          "Thanks for reaching out. We are currently outside business hours. Please leave your request and we will follow up when we reopen.",
      };
    case "escalate":
      return { shouldRespond: false, escalate: true };
    case "hours_only":
    default: {
      const hoursMessage = await resolveBusinessHoursMessage(input.businessId);
      return {
        shouldRespond: true,
        message:
          hoursMessage ??
          "We are currently outside business hours. Please contact us again during our opening hours.",
      };
    }
  }
}

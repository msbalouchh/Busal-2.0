import type { StaffRecord, StaffShift } from "@/modules/staff/types/staff-platform";

export function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return (hours ?? 0) * 60 + (minutes ?? 0);
}

export function calculateShiftDurationMinutes(shift: StaffShift): number {
  const start = parseTimeToMinutes(shift.startTime);
  const end = parseTimeToMinutes(shift.endTime);
  const gross = end > start ? end - start : end + 24 * 60 - start;
  return Math.max(0, gross - shift.breakMinutes);
}

export function calculateWeeklyScheduledHours(record: StaffRecord): number {
  const shiftMinutes = record.shifts.reduce((sum, shift) => {
    if (shift.status === "cancelled") {
      return sum;
    }

    return sum + calculateShiftDurationMinutes(shift);
  }, 0);

  return Math.round((shiftMinutes / 60) * 10) / 10;
}

export function groupShiftsByDate(shifts: StaffShift[]): Map<string, StaffShift[]> {
  const groups = new Map<string, StaffShift[]>();

  for (const shift of shifts) {
    const existing = groups.get(shift.shiftDate) ?? [];
    existing.push(shift);
    groups.set(shift.shiftDate, existing);
  }

  return groups;
}

export function calculateLabourCoverage(
  records: StaffRecord[],
  shiftDate: string,
): { scheduled: number; required: number; gap: number } {
  const scheduled = records.reduce((sum, record) => {
    const dayShifts = record.shifts.filter(
      (s) => s.shiftDate === shiftDate && s.status !== "cancelled",
    );
    const minutes = dayShifts.reduce((ms, s) => ms + calculateShiftDurationMinutes(s), 0);
    return sum + minutes / 60;
  }, 0);

  const required = 48;
  const gap = Math.max(0, required - scheduled);

  return {
    scheduled: Math.round(scheduled * 10) / 10,
    required,
    gap: Math.round(gap * 10) / 10,
  };
}

export function sortShiftsByStartTime(shifts: StaffShift[]): StaffShift[] {
  return [...shifts].sort(
    (a, b) => parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime),
  );
}

export function detectShiftConflicts(record: StaffRecord, newShift: StaffShift): boolean {
  const newStart = parseTimeToMinutes(newShift.startTime);
  const newEnd = parseTimeToMinutes(newShift.endTime);

  return record.shifts.some((existing) => {
    if (existing.shiftDate !== newShift.shiftDate || existing.status === "cancelled") {
      return false;
    }

    const existStart = parseTimeToMinutes(existing.startTime);
    const existEnd = parseTimeToMinutes(existing.endTime);

    return newStart < existEnd && newEnd > existStart;
  });
}

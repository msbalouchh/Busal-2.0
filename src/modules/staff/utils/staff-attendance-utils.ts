import type { Attendance, StaffRecord } from "@/modules/staff/types/staff-platform";

export function calculateWorkedMinutes(attendance: Attendance): number {
  if (!attendance.clockInAt || !attendance.clockOutAt) {
    return attendance.workedMinutes;
  }

  const clockIn = new Date(attendance.clockInAt).getTime();
  const clockOut = new Date(attendance.clockOutAt).getTime();
  return Math.floor((clockOut - clockIn) / 60_000);
}

export function calculateOvertimeMinutes(attendance: Attendance): number {
  const overtime = attendance.workedMinutes - attendance.scheduledMinutes;
  return Math.max(0, overtime);
}

export function getAttendanceRate(records: StaffRecord[]): number {
  if (records.length === 0) {
    return 100;
  }

  const sum = records.reduce((acc, r) => acc + r.analytics.attendanceRateBps, 0);
  return Math.round(sum / records.length / 100);
}

export function getLateAttendanceRecords(records: StaffRecord[]): StaffRecord[] {
  return records.filter((r) => r.attendance.some((a) => a.status === "late"));
}

export function getAbsentAttendanceRecords(records: StaffRecord[]): StaffRecord[] {
  return records.filter((r) => r.attendance.some((a) => a.status === "absent"));
}

export function countPresentToday(records: StaffRecord[], date: string): number {
  return records.filter((r) =>
    r.attendance.some((a) => a.attendanceDate === date && a.status === "present"),
  ).length;
}

export function countLateToday(records: StaffRecord[], date: string): number {
  return records.filter((r) =>
    r.attendance.some((a) => a.attendanceDate === date && a.status === "late"),
  ).length;
}

export function countAbsentToday(records: StaffRecord[], date: string): number {
  return records.filter((r) =>
    r.attendance.some((a) => a.attendanceDate === date && a.status === "absent"),
  ).length;
}

export function formatAttendanceDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

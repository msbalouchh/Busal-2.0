import type { EmploymentStatus, LeaveStatus } from "@/modules/staff/constants/staff-status";
import type { StaffRecord } from "@/modules/staff/types/staff-platform";

export function getStaffSummary(record: StaffRecord): string {
  return `${record.member.displayName} (${record.member.employeeNumber}) — ${record.designation.title}`;
}

export function getStaffDisplayName(record: StaffRecord): string {
  return record.member.displayName;
}

export function getPrimaryBranch(record: StaffRecord): string | null {
  return record.branchAssignments.find((ba) => ba.isPrimary)?.branchName ?? null;
}

export function getPrimaryRole(record: StaffRecord): string | null {
  return record.roleAssignments[0]?.roleName ?? null;
}

export function isActiveStaff(record: StaffRecord): boolean {
  return record.member.employmentStatus === "active" && record.member.isActive;
}

export function hasPendingLeave(record: StaffRecord): boolean {
  return record.leaveRequests.some((lr) => lr.status === "pending");
}

export function getPendingLeaveCount(record: StaffRecord): number {
  return record.leaveRequests.filter((lr) => lr.status === "pending").length;
}

export function getUpcomingShiftCount(record: StaffRecord, fromDate: string): number {
  return record.shifts.filter((s) => s.shiftDate >= fromDate && s.status === "scheduled").length;
}

export function getAttendanceRatePercent(record: StaffRecord): number {
  return record.analytics.attendanceRateBps / 100;
}

export function getPerformanceScorePercent(record: StaffRecord): number {
  return record.analytics.avgPerformanceScoreBps / 100;
}

export function getEmploymentStatusSeverity(
  status: EmploymentStatus,
): "ok" | "warning" | "critical" {
  switch (status) {
    case "on_leave":
      return "warning";
    case "suspended":
    case "terminated":
    case "inactive":
      return "critical";
    default:
      return "ok";
  }
}

export function getLeaveStatusSeverity(status: LeaveStatus): "ok" | "warning" | "critical" {
  switch (status) {
    case "pending":
      return "warning";
    case "rejected":
      return "critical";
    default:
      return "ok";
  }
}

export function formatShiftTime(startTime: string, endTime: string): string {
  return `${startTime} – ${endTime}`;
}

import { EMPLOYMENT_STATUSES, LEAVE_STATUSES } from "@/modules/staff/constants/staff-status";
import { DEFAULT_STAFF_SCOPE } from "@/modules/staff/constants/mock-data";
import { staffRepository } from "@/modules/staff/repository/staff-repository";
import type { StaffPlatformContext, StaffRecord } from "@/modules/staff/types/staff-platform";

export interface StaffPlatformSnapshot {
  context: StaffPlatformContext;
  records: StaffRecord[];
  staffCount: number;
  activeCount: number;
  onLeaveCount: number;
  inactiveCount: number;
  pendingLeaveCount: number;
  upcomingShiftCount: number;
  avgAttendanceRateBps: number;
  avgPerformanceScoreBps: number;
}

export interface StaffPlatformInput {
  tenantId?: string;
  workspaceId?: string;
  businessId?: string;
  branchId?: string;
  userId?: string;
}

export function buildStaffPlatformContext(input: StaffPlatformInput = {}): StaffPlatformContext {
  return {
    tenantId: input.tenantId ?? DEFAULT_STAFF_SCOPE.tenantId,
    workspaceId: input.workspaceId ?? DEFAULT_STAFF_SCOPE.workspaceId,
    businessId: input.businessId ?? DEFAULT_STAFF_SCOPE.businessId,
    branchId: input.branchId ?? DEFAULT_STAFF_SCOPE.branchId,
    userId: input.userId ?? DEFAULT_STAFF_SCOPE.userId,
  };
}

export function buildStaffPlatformSnapshot(input: StaffPlatformInput = {}): StaffPlatformSnapshot {
  const context = buildStaffPlatformContext(input);
  const records = staffRepository
    .listRecords()
    .filter(
      (record) =>
        record.member.tenantId === context.tenantId &&
        record.member.businessId === context.businessId,
    );

  const countByStatus = (status: string) =>
    records.filter((record) => record.member.employmentStatus === status).length;

  const pendingLeaveCount = records.reduce(
    (sum, r) => sum + r.leaveRequests.filter((lr) => lr.status === LEAVE_STATUSES.PENDING).length,
    0,
  );

  const attendanceSum = records.reduce((sum, r) => sum + r.analytics.attendanceRateBps, 0);
  const performanceSum = records.reduce((sum, r) => sum + r.analytics.avgPerformanceScoreBps, 0);

  return {
    context,
    records,
    staffCount: records.length,
    activeCount: countByStatus(EMPLOYMENT_STATUSES.ACTIVE),
    onLeaveCount: countByStatus(EMPLOYMENT_STATUSES.ON_LEAVE),
    inactiveCount:
      countByStatus(EMPLOYMENT_STATUSES.INACTIVE) +
      countByStatus(EMPLOYMENT_STATUSES.SUSPENDED) +
      countByStatus(EMPLOYMENT_STATUSES.TERMINATED),
    pendingLeaveCount,
    upcomingShiftCount: staffRepository.getUpcomingShifts(50).length,
    avgAttendanceRateBps: records.length > 0 ? Math.round(attendanceSum / records.length) : 10000,
    avgPerformanceScoreBps: records.length > 0 ? Math.round(performanceSum / records.length) : 0,
  };
}

export function getDefaultStaffSnapshot(): StaffPlatformSnapshot {
  return buildStaffPlatformSnapshot();
}

export function getActiveStaff(limit = 20): StaffRecord[] {
  return staffRepository.search({ employmentStatus: EMPLOYMENT_STATUSES.ACTIVE, limit });
}

import "server-only";

import { EMPLOYMENT_STATUSES, LEAVE_STATUSES } from "@/modules/staff/constants/staff-status";
import { buildStaffPlatformContext } from "@/modules/staff/lib/staff-platform-context";
import { resolveStaffScope, toStaffPlatformContext } from "@/modules/staff/lib/staff-scope";
import { staffRepository } from "@/modules/staff/repository/staff-repository";
import type {
  StaffPlatformContext,
  StaffPlatformSnapshot,
  StaffRecord,
} from "@/modules/staff/types/staff-platform";

export type { StaffPlatformSnapshot };

export interface StaffPlatformInput {
  tenantId?: string;
  workspaceId?: string;
  businessId: string;
  branchId: string;
  userId?: string;
}

export { buildStaffPlatformContext };

export async function buildStaffPlatformSnapshot(
  context: StaffPlatformContext,
): Promise<StaffPlatformSnapshot> {
  const scope = {
    tenantId: context.tenantId,
    workspaceId: context.workspaceId,
    businessId: context.businessId,
    branchId: context.branchId,
    userId: context.userId,
    actorStaffId: null,
  };

  const [records, upcomingShifts] = await Promise.all([
    staffRepository.listRecords(scope),
    staffRepository.getUpcomingShifts(scope, 50),
  ]);

  const countByStatus = (status: string) =>
    records.filter((record) => record.member.employmentStatus === status).length;

  const pendingLeaveCount = records.reduce(
    (sum, record) =>
      sum + record.leaveRequests.filter((leave) => leave.status === LEAVE_STATUSES.PENDING).length,
    0,
  );

  const attendanceSum = records.reduce((sum, record) => sum + record.analytics.attendanceRateBps, 0);
  const performanceSum = records.reduce(
    (sum, record) => sum + record.analytics.avgPerformanceScoreBps,
    0,
  );

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
    upcomingShiftCount: upcomingShifts.length,
    avgAttendanceRateBps: records.length > 0 ? Math.round(attendanceSum / records.length) : 10_000,
    avgPerformanceScoreBps: records.length > 0 ? Math.round(performanceSum / records.length) : 0,
  };
}

export async function getActiveStaff(
  context: StaffPlatformContext,
  limit = 20,
): Promise<StaffRecord[]> {
  const scope = {
    tenantId: context.tenantId,
    workspaceId: context.workspaceId,
    businessId: context.businessId,
    branchId: context.branchId,
    userId: context.userId,
    actorStaffId: null,
  };

  const result = await staffRepository.search(scope, {
    employmentStatus: EMPLOYMENT_STATUSES.ACTIVE,
    page: 1,
    pageSize: limit,
  });

  return result.records;
}

export function buildStaffPlatformContextFromPlatform(
  platform: Parameters<typeof resolveStaffScope>[0],
) {
  return toStaffPlatformContext(resolveStaffScope(platform));
}

import { LEAVE_STATUSES } from "@/modules/staff/constants/staff-status";
import { DEFAULT_STAFF_SCOPE } from "@/modules/staff/constants/mock-data";
import { staffService } from "@/modules/staff/services/staff.service";
import {
  buildStaffPlatformSnapshot,
  getActiveStaff,
} from "@/modules/staff/services/staff-platform.service";
import { getStaffSummary } from "@/modules/staff/utils/staff-selectors";
import {
  calculateLabourCoverage,
  calculateWeeklyScheduledHours,
} from "@/modules/staff/utils/staff-schedule-utils";
import {
  getAbsentAttendanceRecords,
  getLateAttendanceRecords,
} from "@/modules/staff/utils/staff-attendance-utils";
import type { StaffAiContext, StaffRecord } from "@/modules/staff/types/staff-platform";

export function buildStaffAiContext(staffId: string): StaffAiContext | null {
  const record = staffService.getById(staffId);

  if (!record) {
    return null;
  }

  return {
    ...record.aiContext,
    summary: getStaffSummary(record),
    insights: [
      ...record.aiContext.insights,
      `Attendance: ${(record.analytics.attendanceRateBps / 100).toFixed(0)}%`,
      `Performance: ${(record.analytics.avgPerformanceScoreBps / 100).toFixed(0)}%`,
    ],
    lastGeneratedAt: new Date().toISOString(),
  };
}

export function createEmployeeForAi(input: {
  firstName: string;
  lastName: string;
  email: string;
  departmentId: string;
  designationId: string;
  hourlyRateCents?: number;
}): Record<string, unknown> {
  const record = staffService.createEmployee({
    branchId: DEFAULT_STAFF_SCOPE.branchId,
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    departmentId: input.departmentId,
    designationId: input.designationId,
    hireDate: new Date().toISOString().slice(0, 10),
    hourlyRateCents: input.hourlyRateCents,
  });

  return {
    staffId: record.member.id,
    employeeNumber: record.member.employeeNumber,
    displayName: record.member.displayName,
    department: record.department.name,
  };
}

export function assignRoleForAi(
  staffId: string,
  roleId: string,
  roleName: string,
): Record<string, unknown> | null {
  const updated = staffService.assignRole({
    staffId,
    roleId,
    roleName,
    scope: "branch",
    scopeId: DEFAULT_STAFF_SCOPE.branchId,
    assignedByStaffId: DEFAULT_STAFF_SCOPE.managerStaffId,
  });

  if (!updated) {
    return null;
  }

  return {
    staffId,
    roleId,
    roleName,
    assigned: true,
  };
}

export function scheduleShiftForAi(
  staffId: string,
  shiftDate: string,
  startTime: string,
  endTime: string,
): Record<string, unknown> | null {
  const shift = staffService.scheduleShift({
    staffId,
    branchId: DEFAULT_STAFF_SCOPE.branchId,
    shiftDate,
    startTime,
    endTime,
  });

  if (!shift) {
    return null;
  }

  return {
    shiftId: shift.id,
    staffId,
    shiftDate: shift.shiftDate,
    startTime: shift.startTime,
    endTime: shift.endTime,
  };
}

export function approveLeaveForAi(leaveRequestId: string): Record<string, unknown> | null {
  const updated = staffService.approveLeave({
    leaveRequestId,
    approvedByStaffId: DEFAULT_STAFF_SCOPE.managerStaffId,
  });

  if (!updated) {
    return null;
  }

  const leave = updated.leaveRequests.find((lr) => lr.id === leaveRequestId);

  return {
    leaveRequestId,
    staffId: updated.member.id,
    status: leave?.status ?? LEAVE_STATUSES.APPROVED,
    startDate: leave?.startDate,
    endDate: leave?.endDate,
  };
}

export function analyzePerformance(staffId?: string): Record<string, unknown> {
  const records = staffId
    ? [staffService.getById(staffId)].filter((r): r is StaffRecord => r !== null)
    : staffService.list();

  return {
    analyzedCount: records.length,
    staff: records.map((record) => ({
      staffId: record.member.id,
      displayName: record.member.displayName,
      avgScoreBps: record.analytics.avgPerformanceScoreBps,
      trend: record.aiContext.performanceTrend,
      latestRating: record.performanceReviews[0]?.rating ?? null,
      strengths: record.performanceReviews[0]?.strengths ?? [],
      improvements: record.performanceReviews[0]?.improvements ?? [],
    })),
    teamAvgScoreBps:
      records.length > 0
        ? Math.round(
            records.reduce((sum, r) => sum + r.analytics.avgPerformanceScoreBps, 0) /
              records.length,
          )
        : 0,
  };
}

export function recommendStaffing(shiftDate = "2026-02-15"): Record<string, unknown> {
  const records = getActiveStaff();
  const coverage = calculateLabourCoverage(records, shiftDate);

  const byDepartment = records.reduce<Record<string, number>>((acc, record) => {
    const dept = record.department.name;
    acc[dept] = (acc[dept] ?? 0) + 1;
    return acc;
  }, {});

  const recommendations: string[] = [];

  if (coverage.gap > 0) {
    recommendations.push(`Schedule ${coverage.gap} additional hours for ${shiftDate}`);
  }

  if ((byDepartment.Kitchen ?? 0) < 3) {
    recommendations.push("Add kitchen coverage for dinner service");
  }

  if ((byDepartment.Service ?? 0) < 4) {
    recommendations.push("Increase front-of-house staffing for weekend");
  }

  return {
    shiftDate,
    coverage,
    departmentBreakdown: byDepartment,
    recommendations:
      recommendations.length > 0 ? recommendations : ["Current staffing meets requirements"],
  };
}

export function predictLabourDemand(): Record<string, unknown> {
  const snapshot = buildStaffPlatformSnapshot();
  const records = staffService.list();

  const hourlyDemand = [
    { hour: 11, covers: 25, staffNeeded: 4 },
    { hour: 12, covers: 45, staffNeeded: 7 },
    { hour: 13, covers: 38, staffNeeded: 6 },
    { hour: 18, covers: 55, staffNeeded: 9 },
    { hour: 19, covers: 62, staffNeeded: 10 },
    { hour: 20, covers: 48, staffNeeded: 8 },
  ];

  const peak = hourlyDemand.reduce((max, h) => (h.covers > max.covers ? h : max));

  return {
    branchId: snapshot.context.branchId,
    activeStaff: snapshot.activeCount,
    peakHour: peak.hour,
    peakCovers: peak.covers,
    peakStaffNeeded: peak.staffNeeded,
    hourlyForecast: hourlyDemand,
    weeklyScheduledHours: records.reduce((sum, r) => sum + calculateWeeklyScheduledHours(r), 0),
  };
}

export function detectAttendanceIssues(): Record<string, unknown> {
  const records = staffService.list();
  const late = getLateAttendanceRecords(records);
  const absent = getAbsentAttendanceRecords(records);

  const atRisk = records.filter((r) => r.aiContext.attendanceRiskScore >= 0.3);

  return {
    lateCount: late.length,
    absentCount: absent.length,
    atRiskCount: atRisk.length,
    lateStaff: late.map(toAttendanceSummary),
    absentStaff: absent.map(toAttendanceSummary),
    atRiskStaff: atRisk.map(toAttendanceSummary),
    recommendations:
      atRisk.length > 0
        ? ["Review punctuality with flagged staff", "Consider shift time adjustments"]
        : ["No significant attendance issues detected"],
  };
}

function toAttendanceSummary(record: StaffRecord): Record<string, unknown> {
  return {
    staffId: record.member.id,
    displayName: record.member.displayName,
    department: record.department.name,
    attendanceRateBps: record.analytics.attendanceRateBps,
    attendanceRiskScore: record.aiContext.attendanceRiskScore,
    employmentStatus: record.member.employmentStatus,
  };
}

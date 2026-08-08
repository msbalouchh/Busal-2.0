import "server-only";

import { LEAVE_STATUSES } from "@/modules/staff/constants/staff-status";
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
import type { StaffAiContext, StaffPlatformContext, StaffRecord } from "@/modules/staff/types/staff-platform";
import {
  resolveBusinessContextFromModule,
  runModuleAiJsonTask,
  type ModulePlatformContext,
} from "@/services/ai-engine-bridge.service";

const MODULE_NAME = "staff";

function toModulePlatform(context: StaffPlatformContext): ModulePlatformContext {
  return {
    tenantId: context.tenantId,
    workspaceId: context.workspaceId,
    businessId: context.businessId,
    branchId: context.branchId,
    userId: context.userId,
  };
}

async function runStaffAiInference<T extends Record<string, unknown>>(
  context: StaffPlatformContext,
  task: string,
  data: Record<string, unknown>,
  instructions?: string,
): Promise<T | null> {
  const platform = await resolveBusinessContextFromModule(toModulePlatform(context));
  return runModuleAiJsonTask<T>(platform, {
    module: MODULE_NAME,
    task,
    context: data,
    instructions,
  });
}

export async function buildStaffAiContext(
  context: StaffPlatformContext,
  staffId: string,
): Promise<StaffAiContext | null> {
  const record = await staffService.getById(context, staffId);

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

export async function createEmployeeForAi(
  context: StaffPlatformContext,
  input: {
    firstName: string;
    lastName: string;
    email: string;
    departmentId: string;
    designationId: string;
    hourlyRateCents?: number;
  },
): Promise<Record<string, unknown>> {
  const record = await staffService.createEmployee(context, {
    branchId: context.branchId,
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

export async function assignRoleForAi(
  context: StaffPlatformContext,
  staffId: string,
  roleId: string,
  roleName: string,
): Promise<Record<string, unknown> | null> {
  const updated = await staffService.assignRole(context, {
    staffId,
    roleId,
    roleName,
    scope: "branch",
    scopeId: context.branchId,
    assignedByStaffId: context.userId,
  });

  if (!updated) {
    return null;
  }

  return { staffId, roleId, roleName, assigned: true };
}

export async function scheduleShiftForAi(
  context: StaffPlatformContext,
  staffId: string,
  shiftDate: string,
  startTime: string,
  endTime: string,
): Promise<Record<string, unknown> | null> {
  const shift = await staffService.scheduleShift(context, {
    staffId,
    branchId: context.branchId,
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

export async function approveLeaveForAi(
  context: StaffPlatformContext,
  leaveRequestId: string,
): Promise<Record<string, unknown> | null> {
  const updated = await staffService.approveLeave(context, {
    leaveRequestId,
    approvedByStaffId: context.userId,
  });

  if (!updated) {
    return null;
  }

  const leave = updated.leaveRequests.find((entry) => entry.id === leaveRequestId);

  return {
    leaveRequestId,
    staffId: updated.member.id,
    status: leave?.status ?? LEAVE_STATUSES.APPROVED,
    startDate: leave?.startDate,
    endDate: leave?.endDate,
  };
}

export async function analyzePerformance(
  context: StaffPlatformContext,
  staffId?: string,
): Promise<Record<string, unknown>> {
  const records = staffId
    ? [await staffService.getById(context, staffId)].filter(
        (record): record is StaffRecord => record !== null,
      )
    : await staffService.list(context);

  const dataContext = {
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
            records.reduce((sum, record) => sum + record.analytics.avgPerformanceScoreBps, 0) /
              records.length,
          )
        : 0,
  };

  const aiResult = await runStaffAiInference<Record<string, unknown>>(
    context,
    "analyzePerformance",
    dataContext,
    "Analyze staff performance. Return JSON with analyzedCount, staff, teamAvgScoreBps, and insights.",
  );

  if (aiResult) {
    return aiResult;
  }

  return dataContext;
}

export async function recommendStaffing(
  context: StaffPlatformContext,
  shiftDate?: string,
): Promise<Record<string, unknown>> {
  const date = shiftDate ?? new Date().toISOString().slice(0, 10);
  const records = await getActiveStaff(context);
  const coverage = calculateLabourCoverage(records, date);

  const byDepartment = records.reduce<Record<string, number>>((acc, record) => {
    const dept = record.department.name;
    acc[dept] = (acc[dept] ?? 0) + 1;
    return acc;
  }, {});

  const dataContext = {
    shiftDate: date,
    coverage,
    departmentBreakdown: byDepartment,
    activeStaffCount: records.length,
  };

  const aiResult = await runStaffAiInference<Record<string, unknown>>(
    context,
    "recommendStaffing",
    dataContext,
    "Recommend staffing levels. Return JSON with shiftDate, coverage, departmentBreakdown, and recommendations array.",
  );

  if (aiResult) {
    return aiResult;
  }

  return dataContext;
}

export async function predictLabourDemand(context: StaffPlatformContext): Promise<Record<string, unknown>> {
  const snapshot = await buildStaffPlatformSnapshot(context);
  const records = await staffService.list(context);
  const dataContext = {
    branchId: snapshot.context.branchId,
    activeStaff: snapshot.activeCount,
    weeklyScheduledHours: records.reduce((sum, record) => sum + calculateWeeklyScheduledHours(record), 0),
    staffCount: records.length,
  };

  const aiResult = await runStaffAiInference<Record<string, unknown>>(
    context,
    "predictLabourDemand",
    dataContext,
    "Predict labour demand. Return JSON with branchId, activeStaff, peakHour, peakCovers, peakStaffNeeded, and hourlyForecast.",
  );

  if (aiResult) {
    return aiResult;
  }

  return {
    ...dataContext,
    peakStaffNeeded: snapshot.activeCount,
  };
}

export async function detectAttendanceIssues(context: StaffPlatformContext): Promise<Record<string, unknown>> {
  const records = await staffService.list(context);
  const late = getLateAttendanceRecords(records);
  const absent = getAbsentAttendanceRecords(records);
  const atRisk = records.filter((record) => record.aiContext.attendanceRiskScore >= 0.3);

  const dataContext = {
    lateCount: late.length,
    absentCount: absent.length,
    atRiskCount: atRisk.length,
    lateStaff: late.map(toAttendanceSummary),
    absentStaff: absent.map(toAttendanceSummary),
    atRiskStaff: atRisk.map(toAttendanceSummary),
  };

  const aiResult = await runStaffAiInference<Record<string, unknown>>(
    context,
    "detectAttendanceIssues",
    dataContext,
    "Detect attendance issues. Return JSON with lateCount, absentCount, atRiskCount, lateStaff, absentStaff, atRiskStaff, and recommendations.",
  );

  if (aiResult) {
    return aiResult;
  }

  return dataContext;
}

export async function suggestTraining(context: StaffPlatformContext): Promise<Record<string, unknown>> {
  const records = await staffService.list(context);
  const needsTraining = records.filter(
    (record) => record.analytics.trainingCompletionRateBps < 7000 || record.trainingRecords.length === 0,
  );

  const dataContext = {
    branchId: context.branchId,
    recommendationCount: needsTraining.length,
    staff: needsTraining.map((record) => ({
      staffId: record.member.id,
      displayName: record.member.displayName,
      department: record.department.name,
      trainingCompletionRateBps: record.analytics.trainingCompletionRateBps,
    })),
  };

  const aiResult = await runStaffAiInference<Record<string, unknown>>(
    context,
    "suggestTraining",
    dataContext,
    "Suggest training. Return JSON with branchId, recommendationCount, and recommendations array (staffId, displayName, department, suggestedCourses).",
  );

  if (aiResult) {
    return aiResult;
  }

  return dataContext;
}

export async function optimizeWorkforceAllocation(
  context: StaffPlatformContext,
): Promise<Record<string, unknown>> {
  const snapshot = await buildStaffPlatformSnapshot(context);
  const records = await staffService.list(context);
  const demand = await predictLabourDemand(context);

  const allocations = records.map((record) => ({
    staffId: record.member.id,
    displayName: record.member.displayName,
    department: record.department.name,
    currentShiftHours: calculateWeeklyScheduledHours(record),
    recommendedShiftHours: record.aiContext.recommendedShiftHours,
    gapHours: record.aiContext.recommendedShiftHours - calculateWeeklyScheduledHours(record),
  }));

  return {
    branchId: context.branchId,
    activeStaff: snapshot.activeCount,
    peakStaffNeeded: demand.peakStaffNeeded,
    allocations,
    understaffedDepartments: allocations.filter((entry) => entry.gapHours > 0).length,
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

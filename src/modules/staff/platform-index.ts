export {
  EMPLOYMENT_STATUSES,
  STAFF_DEPARTMENTS,
  STAFF_SHIFT_STATUSES,
  ATTENDANCE_STATUSES,
  LEAVE_TYPES,
  LEAVE_STATUSES,
  PERFORMANCE_RATINGS,
  TRAINING_STATUSES,
  STAFF_ACTIVITY_EVENT_TYPES,
  PAYROLL_FREQUENCIES,
  STAFF_AI_TOOL_IDS,
  STAFF_PERMISSIONS,
  EMPLOYMENT_STATUS_LABELS,
  STAFF_DEPARTMENT_LABELS,
  LEAVE_STATUS_LABELS,
  type EmploymentStatus,
  type StaffDepartment,
  type StaffShiftStatus,
  type AttendanceStatus,
  type LeaveType,
  type LeaveStatus,
  type PerformanceRating,
  type TrainingStatus,
  type StaffActivityEventType,
  type PayrollFrequency,
  type StaffAiToolId,
  type StaffPermission,
} from "@/modules/staff/constants/staff-status";

export {
  STAFF_INTEGRATION_POINTS,
  type StaffIntegrationPoint,
} from "@/modules/staff/constants/integration-points";

export {
  STAFF_PLATFORM_ROUTES,
  STAFF_PLATFORM_NAV_ITEMS,
} from "@/modules/staff/constants/platform-routes";

export {
  DEFAULT_STAFF_SCOPE,
  MOCK_DEPARTMENTS,
  MOCK_DESIGNATIONS,
  MOCK_STAFF_RECORDS,
} from "@/modules/staff/constants/mock-data";

export type * from "@/modules/staff/types/staff-platform";

export * from "@/modules/staff/utils/staff-selectors";
export * from "@/modules/staff/utils/staff-schedule-utils";
export * from "@/modules/staff/utils/staff-attendance-utils";

export { StaffRepository, staffRepository } from "@/modules/staff/repository/staff-repository";

export { StaffService, staffService } from "@/modules/staff/services/staff.service";

export {
  buildStaffPlatformContext,
  buildStaffPlatformSnapshot,
  getDefaultStaffSnapshot,
  getActiveStaff,
  type StaffPlatformSnapshot,
  type StaffPlatformInput,
} from "@/modules/staff/services/staff-platform.service";

export { StaffProvider } from "@/modules/staff/providers/staff-provider";
export { StaffContext } from "@/modules/staff/contexts/staff-context";

export { useStaff, useStaffContext } from "@/modules/staff/hooks/use-staff";
export { useStaffSchedule } from "@/modules/staff/hooks/use-staff-schedule";
export { useStaffAttendance } from "@/modules/staff/hooks/use-staff-attendance";

export { EmploymentStatusBadge } from "@/modules/staff/components/employment-status-badge";
export { DepartmentBadge } from "@/modules/staff/components/department-badge";
export { LeaveStatusBadge } from "@/modules/staff/components/leave-status-badge";

export {
  registerStaffAiTools,
  STAFF_AI_TOOLS,
  buildStaffAiContext,
  createEmployeeForAi,
  assignRoleForAi,
  scheduleShiftForAi,
  approveLeaveForAi,
  analyzePerformance,
  recommendStaffing,
  predictLabourDemand,
  detectAttendanceIssues,
} from "@/modules/staff/ai";

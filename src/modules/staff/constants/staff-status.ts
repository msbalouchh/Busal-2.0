/** Employment lifecycle statuses. */
export const EMPLOYMENT_STATUSES = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  ON_LEAVE: "on_leave",
  SUSPENDED: "suspended",
  TERMINATED: "terminated",
} as const;

export type EmploymentStatus = (typeof EMPLOYMENT_STATUSES)[keyof typeof EMPLOYMENT_STATUSES];

/** Organisational departments. */
export const STAFF_DEPARTMENTS = {
  MANAGEMENT: "management",
  KITCHEN: "kitchen",
  SERVICE: "service",
  DELIVERY: "delivery",
  MARKETING: "marketing",
  FINANCE: "finance",
  HR: "hr",
  OPERATIONS: "operations",
  CUSTOM: "custom",
} as const;

export type StaffDepartment = (typeof STAFF_DEPARTMENTS)[keyof typeof STAFF_DEPARTMENTS];

/** Shift lifecycle statuses. */
export const STAFF_SHIFT_STATUSES = {
  SCHEDULED: "scheduled",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  NO_SHOW: "no_show",
} as const;

export type StaffShiftStatus = (typeof STAFF_SHIFT_STATUSES)[keyof typeof STAFF_SHIFT_STATUSES];

/** Attendance record statuses. */
export const ATTENDANCE_STATUSES = {
  PRESENT: "present",
  ABSENT: "absent",
  LATE: "late",
  EARLY_DEPARTURE: "early_departure",
  ON_BREAK: "on_break",
} as const;

export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[keyof typeof ATTENDANCE_STATUSES];

/** Leave request types and statuses. */
export const LEAVE_TYPES = {
  ANNUAL: "annual",
  SICK: "sick",
  UNPAID: "unpaid",
  MATERNITY: "maternity",
  PATERNITY: "paternity",
  BEREAVEMENT: "bereavement",
  OTHER: "other",
} as const;

export type LeaveType = (typeof LEAVE_TYPES)[keyof typeof LEAVE_TYPES];

export const LEAVE_STATUSES = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  CANCELLED: "cancelled",
} as const;

export type LeaveStatus = (typeof LEAVE_STATUSES)[keyof typeof LEAVE_STATUSES];

/** Performance review rating scale. */
export const PERFORMANCE_RATINGS = {
  EXCEEDS: "exceeds",
  MEETS: "meets",
  NEEDS_IMPROVEMENT: "needs_improvement",
  UNSATISFACTORY: "unsatisfactory",
} as const;

export type PerformanceRating = (typeof PERFORMANCE_RATINGS)[keyof typeof PERFORMANCE_RATINGS];

/** Training record statuses. */
export const TRAINING_STATUSES = {
  SCHEDULED: "scheduled",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  EXPIRED: "expired",
} as const;

export type TrainingStatus = (typeof TRAINING_STATUSES)[keyof typeof TRAINING_STATUSES];

/** Activity log event types. */
export const STAFF_ACTIVITY_EVENT_TYPES = {
  HIRED: "hired",
  ROLE_ASSIGNED: "role_assigned",
  SHIFT_SCHEDULED: "shift_scheduled",
  CLOCK_IN: "clock_in",
  CLOCK_OUT: "clock_out",
  LEAVE_REQUESTED: "leave_requested",
  LEAVE_APPROVED: "leave_approved",
  REVIEW_COMPLETED: "review_completed",
  TRAINING_COMPLETED: "training_completed",
  DOCUMENT_UPLOADED: "document_uploaded",
  STATUS_CHANGED: "status_changed",
} as const;

export type StaffActivityEventType =
  (typeof STAFF_ACTIVITY_EVENT_TYPES)[keyof typeof STAFF_ACTIVITY_EVENT_TYPES];

/** Payroll frequency options. */
export const PAYROLL_FREQUENCIES = {
  WEEKLY: "weekly",
  BIWEEKLY: "biweekly",
  MONTHLY: "monthly",
} as const;

export type PayrollFrequency = (typeof PAYROLL_FREQUENCIES)[keyof typeof PAYROLL_FREQUENCIES];

export const STAFF_AI_TOOL_IDS = {
  CREATE_EMPLOYEE: "staff.create-employee",
  ASSIGN_ROLE: "staff.assign-role",
  SCHEDULE_SHIFT: "staff.schedule-shift",
  APPROVE_LEAVE: "staff.approve-leave",
  ANALYZE_PERFORMANCE: "staff.analyze-performance",
  RECOMMEND_STAFFING: "staff.recommend-staffing",
  PREDICT_LABOUR_DEMAND: "staff.predict-labour-demand",
  DETECT_ATTENDANCE_ISSUES: "staff.detect-attendance-issues",
  SUGGEST_TRAINING: "staff.suggest-training",
  OPTIMIZE_WORKFORCE: "staff.optimize-workforce",
} as const;

export type StaffAiToolId = (typeof STAFF_AI_TOOL_IDS)[keyof typeof STAFF_AI_TOOL_IDS];

/** Module-local permission markers (future RBAC wiring). */
export const STAFF_PERMISSIONS = {
  READ: "staff.read",
  MANAGE: "staff.manage",
  SCHEDULE: "staff.schedule",
  LEAVE_APPROVE: "staff.leave.approve",
  PAYROLL_READ: "staff.payroll.read",
  ANALYTICS_READ: "staff.analytics.read",
} as const;

export type StaffPermission = (typeof STAFF_PERMISSIONS)[keyof typeof STAFF_PERMISSIONS];

export const EMPLOYMENT_STATUS_LABELS: Record<EmploymentStatus, string> = {
  active: "Active",
  inactive: "Inactive",
  on_leave: "On Leave",
  suspended: "Suspended",
  terminated: "Terminated",
};

export const STAFF_DEPARTMENT_LABELS: Record<StaffDepartment, string> = {
  management: "Management",
  kitchen: "Kitchen",
  service: "Service",
  delivery: "Delivery",
  marketing: "Marketing",
  finance: "Finance",
  hr: "HR",
  operations: "Operations",
  custom: "Custom",
};

export const LEAVE_STATUS_LABELS: Record<LeaveStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

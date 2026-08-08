import type {
  Permission,
  Prisma,
  Role,
  Staff,
  StaffAuditLog,
  StaffAuditEventType,
  StaffBranchAssignment,
  StaffEmploymentStatus,
  StaffRole,
} from "@prisma/client";

import {
  ATTENDANCE_STATUSES,
  EMPLOYMENT_STATUSES,
  LEAVE_STATUSES,
  PAYROLL_FREQUENCIES,
  STAFF_ACTIVITY_EVENT_TYPES,
  STAFF_DEPARTMENTS,
  STAFF_SHIFT_STATUSES,
  type AttendanceStatus,
  type EmploymentStatus,
  type StaffDepartment,
} from "@/modules/staff/constants/staff-status";
import type { StaffTenantScope } from "@/modules/staff/lib/staff-scope";
import { parseStaffProfile } from "@/modules/staff/utils/staff-profile";
import type {
  Attendance,
  BranchAssignment,
  Certification,
  Department,
  Designation,
  EmergencyContact,
  EmployeeProfile,
  LeaveRequest,
  PayrollProfile,
  PerformanceReview,
  PermissionAssignment,
  RoleAssignment,
  ShiftSchedule,
  StaffActivityLog,
  StaffAiContext,
  StaffAnalytics,
  StaffDocument,
  StaffMember,
  StaffRecord,
  StaffShift,
  TrainingRecord,
} from "@/modules/staff/types/staff-platform";

export interface StoredStaffProfileMeta {
  departmentId?: string;
  designationId?: string;
  managerStaffId?: string | null;
  address?: string | null;
  city?: string | null;
  postcode?: string | null;
  country?: string;
  preferredLanguage?: string;
  timezone?: string;
  nationalId?: string | null;
  bio?: string | null;
  payFrequency?: PayrollProfile["payFrequency"];
  taxCode?: string | null;
  bankAccountLast4?: string | null;
  isPayrollEnabled?: boolean;
}

export interface StoredStaffBranchMeta {
  departments?: Department[];
  designations?: Designation[];
  shifts?: StaffShift[];
  schedules?: ShiftSchedule[];
  attendance?: Attendance[];
  leaveRequests?: LeaveRequest[];
  performanceReviews?: PerformanceReview[];
  trainingRecords?: TrainingRecord[];
  certifications?: Certification[];
  documents?: StaffDocument[];
}

export type StaffWithRelations = Staff & {
  branch: { id: string; name: string } | null;
  staffRoles: Array<StaffRole & { role: Pick<Role, "id" | "name" | "slug"> }>;
  branchAssignments: Array<StaffBranchAssignment & { branch: { id: string; name: string } }>;
  auditLogs?: StaffAuditLog[];
};

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function iso(value: Date | string | null | undefined): string {
  if (!value) {
    return new Date().toISOString();
  }
  return value instanceof Date ? value.toISOString() : value;
}

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function cents(value: Prisma.Decimal | number | null | undefined): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  return Math.round(Number(value) * 100);
}

export function mapPrismaEmploymentStatus(status: StaffEmploymentStatus, isActive: boolean): EmploymentStatus {
  if (!isActive) {
    return EMPLOYMENT_STATUSES.INACTIVE;
  }

  switch (status) {
    case "ON_LEAVE":
      return EMPLOYMENT_STATUSES.ON_LEAVE;
    case "TERMINATED":
      return EMPLOYMENT_STATUSES.TERMINATED;
    case "PROBATION":
    case "ACTIVE":
    default:
      return EMPLOYMENT_STATUSES.ACTIVE;
  }
}

export function mapEmploymentStatusToPrisma(status: EmploymentStatus): StaffEmploymentStatus {
  switch (status) {
    case EMPLOYMENT_STATUSES.ON_LEAVE:
      return "ON_LEAVE";
    case EMPLOYMENT_STATUSES.TERMINATED:
      return "TERMINATED";
    case EMPLOYMENT_STATUSES.ACTIVE:
    case EMPLOYMENT_STATUSES.INACTIVE:
    case EMPLOYMENT_STATUSES.SUSPENDED:
    default:
      return "ACTIVE";
  }
}

export function departmentIdFromName(name: string): string {
  return `dept-${slugify(name || "general")}`;
}

export function designationIdFromTitle(title: string, departmentId: string): string {
  return `desig-${slugify(departmentId)}-${slugify(title || "staff")}`;
}

export function inferDepartmentType(name: string): StaffDepartment {
  const normalized = name.toLowerCase();
  if (normalized.includes("kitchen")) return STAFF_DEPARTMENTS.KITCHEN;
  if (normalized.includes("service") || normalized.includes("front")) return STAFF_DEPARTMENTS.SERVICE;
  if (normalized.includes("delivery")) return STAFF_DEPARTMENTS.DELIVERY;
  if (normalized.includes("hr") || normalized.includes("human")) return STAFF_DEPARTMENTS.HR;
  if (normalized.includes("finance")) return STAFF_DEPARTMENTS.FINANCE;
  if (normalized.includes("market")) return STAFF_DEPARTMENTS.MARKETING;
  if (normalized.includes("manage")) return STAFF_DEPARTMENTS.MANAGEMENT;
  return STAFF_DEPARTMENTS.CUSTOM;
}

export function mapStringDepartment(scope: StaffTenantScope, name: string): Department {
  const now = new Date().toISOString();
  return {
    id: departmentIdFromName(name),
    tenantId: scope.tenantId,
    businessId: scope.businessId,
    name,
    departmentType: inferDepartmentType(name),
    customLabel: null,
    displayOrder: 99,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };
}

export function mapDesignation(
  scope: StaffTenantScope,
  title: string,
  departmentId: string,
): Designation {
  return {
    id: designationIdFromTitle(title, departmentId),
    tenantId: scope.tenantId,
    businessId: scope.businessId,
    departmentId,
    title,
    level: 2,
    description: null,
    isActive: true,
  };
}

export function defaultBranchStaffMeta(scope: StaffTenantScope): StoredStaffBranchMeta {
  const now = new Date().toISOString();
  const departments: Department[] = [
    {
      id: "dept-management",
      tenantId: scope.tenantId,
      businessId: scope.businessId,
      name: "Management",
      departmentType: STAFF_DEPARTMENTS.MANAGEMENT,
      customLabel: null,
      displayOrder: 1,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "dept-kitchen",
      tenantId: scope.tenantId,
      businessId: scope.businessId,
      name: "Kitchen",
      departmentType: STAFF_DEPARTMENTS.KITCHEN,
      customLabel: null,
      displayOrder: 2,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "dept-service",
      tenantId: scope.tenantId,
      businessId: scope.businessId,
      name: "Service",
      departmentType: STAFF_DEPARTMENTS.SERVICE,
      customLabel: null,
      displayOrder: 3,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  return {
    departments,
    designations: departments.flatMap((department) => [
      mapDesignation(scope, "Team Member", department.id),
      mapDesignation(scope, "Supervisor", department.id),
    ]),
    shifts: [],
    schedules: [],
    attendance: [],
    leaveRequests: [],
    performanceReviews: [],
    trainingRecords: [],
    certifications: [],
    documents: [],
  };
}

function parseProfileMeta(raw: unknown): StoredStaffProfileMeta {
  const profile =
    raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const platform =
    profile.platform && typeof profile.platform === "object" && profile.platform !== null
      ? (profile.platform as Record<string, unknown>)
      : {};

  return {
    departmentId: typeof platform.departmentId === "string" ? platform.departmentId : undefined,
    designationId: typeof platform.designationId === "string" ? platform.designationId : undefined,
    managerStaffId:
      typeof platform.managerStaffId === "string" ? platform.managerStaffId : null,
    address: typeof platform.address === "string" ? platform.address : null,
    city: typeof platform.city === "string" ? platform.city : null,
    postcode: typeof platform.postcode === "string" ? platform.postcode : null,
    country: typeof platform.country === "string" ? platform.country : "GB",
    preferredLanguage:
      typeof platform.preferredLanguage === "string" ? platform.preferredLanguage : "en-GB",
    timezone: typeof platform.timezone === "string" ? platform.timezone : "Europe/London",
    nationalId: typeof platform.nationalId === "string" ? platform.nationalId : null,
    bio: typeof platform.bio === "string" ? platform.bio : null,
    payFrequency:
      platform.payFrequency === "weekly" ||
      platform.payFrequency === "biweekly" ||
      platform.payFrequency === "monthly"
        ? platform.payFrequency
        : PAYROLL_FREQUENCIES.MONTHLY,
    taxCode: typeof platform.taxCode === "string" ? platform.taxCode : null,
    bankAccountLast4:
      typeof platform.bankAccountLast4 === "string" ? platform.bankAccountLast4 : null,
    isPayrollEnabled:
      typeof platform.isPayrollEnabled === "boolean" ? platform.isPayrollEnabled : true,
  };
}

export function mergeProfileMeta(
  existing: unknown,
  patch: Partial<StoredStaffProfileMeta>,
): Record<string, unknown> {
  const current = parseStaffProfile(existing);
  const meta = parseProfileMeta(existing);

  return {
    ...current,
    platform: {
      ...meta,
      ...patch,
    },
  };
}

function mapAuditEvent(eventType: StaffAuditEventType): StaffActivityLog["eventType"] {
  switch (eventType) {
    case "ROLE_CHANGED":
      return STAFF_ACTIVITY_EVENT_TYPES.ROLE_ASSIGNED;
    case "DEACTIVATED":
    case "ARCHIVED":
      return STAFF_ACTIVITY_EVENT_TYPES.STATUS_CHANGED;
    case "CREATED":
      return STAFF_ACTIVITY_EVENT_TYPES.HIRED;
    default:
      return STAFF_ACTIVITY_EVENT_TYPES.STATUS_CHANGED;
  }
}

function mapAuditLogs(scope: StaffTenantScope, staffId: string, logs: StaffAuditLog[]): StaffActivityLog[] {
  return logs.map((log) => ({
    id: log.id,
    staffId,
    tenantId: scope.tenantId,
    businessId: scope.businessId,
    eventType: mapAuditEvent(log.eventType),
    actorStaffId: log.actorStaffId,
    message: log.eventType.replace(/_/g, " ").toLowerCase(),
    metadata:
      log.metadata && typeof log.metadata === "object" && !Array.isArray(log.metadata)
        ? (log.metadata as Record<string, string | number | boolean | null>)
        : {},
    occurredAt: iso(log.createdAt),
  }));
}

function buildEmergencyContacts(staff: Staff): EmergencyContact[] {
  const raw = staff.emergencyContact;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return [];
  }

  const contact = raw as Record<string, unknown>;
  if (typeof contact.name !== "string" || !contact.name.trim()) {
    return [];
  }

  return [
    {
      id: createId("ec"),
      staffId: staff.id,
      name: contact.name,
      relationship: typeof contact.relationship === "string" ? contact.relationship : "Contact",
      phone: typeof contact.phone === "string" ? contact.phone : "",
      email: null,
      isPrimary: true,
    },
  ];
}

function buildAnalytics(
  staffId: string,
  attendance: Attendance[],
  leaveRequests: LeaveRequest[],
  performanceReviews: PerformanceReview[],
  trainingRecords: TrainingRecord[],
): StaffAnalytics {
  const presentCount = attendance.filter((entry) => entry.status === ATTENDANCE_STATUSES.PRESENT).length;
  const attendanceRateBps =
    attendance.length > 0 ? Math.round((presentCount / attendance.length) * 10_000) : 10_000;
  const lateCount = attendance.filter((entry) => entry.status === ATTENDANCE_STATUSES.LATE).length;
  const punctualityRateBps =
    attendance.length > 0
      ? Math.round(((attendance.length - lateCount) / attendance.length) * 10_000)
      : 10_000;
  const approvedLeaveDays = leaveRequests
    .filter((entry) => entry.status === LEAVE_STATUSES.APPROVED)
    .reduce((sum, entry) => sum + entry.totalDays, 0);
  const avgPerformanceScoreBps =
    performanceReviews.length > 0
      ? Math.round(
          performanceReviews.reduce((sum, review) => sum + review.scoreBps, 0) /
            performanceReviews.length,
        )
      : 0;
  const completedTraining = trainingRecords.filter((entry) => entry.status === "completed").length;
  const trainingCompletionRateBps =
    trainingRecords.length > 0
      ? Math.round((completedTraining / trainingRecords.length) * 10_000)
      : 0;

  return {
    staffId,
    attendanceRateBps,
    punctualityRateBps,
    overtimeHoursMonth: Math.round(
      attendance.reduce((sum, entry) => sum + entry.overtimeMinutes, 0) / 60,
    ),
    leaveDaysUsed: approvedLeaveDays,
    leaveDaysRemaining: Math.max(0, 28 - approvedLeaveDays),
    avgPerformanceScoreBps,
    trainingCompletionRateBps,
    shiftCoverageRateBps: 10_000,
  };
}

function buildAiContext(
  member: StaffMember,
  analytics: StaffAnalytics,
  attendance: Attendance[],
): StaffAiContext {
  const lateCount = attendance.filter((entry) => entry.status === ATTENDANCE_STATUSES.LATE).length;
  const absentCount = attendance.filter((entry) => entry.status === ATTENDANCE_STATUSES.ABSENT).length;
  const attendanceRiskScore = Math.min(1, (lateCount + absentCount * 2) / 10);

  return {
    staffId: member.id,
    summary: `${member.displayName} — ${member.employmentStatus}`,
    labourDemandScore: 0.5,
    staffingGapHours: 0,
    attendanceRiskScore,
    performanceTrend:
      analytics.avgPerformanceScoreBps >= 8000
        ? "improving"
        : analytics.avgPerformanceScoreBps >= 6000
          ? "stable"
          : "declining",
    recommendedShiftHours: 40,
    insights: [
      `Attendance rate: ${(analytics.attendanceRateBps / 100).toFixed(0)}%`,
      `Leave remaining: ${analytics.leaveDaysRemaining} days`,
    ],
    recommendedActions:
      attendanceRiskScore >= 0.3 ? ["Review attendance patterns"] : ["Maintain current schedule"],
    lastGeneratedAt: new Date().toISOString(),
  };
}

export function mapPermissionAssignments(
  scope: StaffTenantScope,
  staffId: string,
  permissions: Permission[],
): PermissionAssignment[] {
  return permissions.map((permission) => ({
    id: `${staffId}-${permission.id}`,
    staffId,
    permission: permission.code,
    scope: "business" as const,
    scopeId: scope.businessId,
    grantedAt: new Date().toISOString(),
    grantedByStaffId: scope.actorStaffId ?? scope.userId,
  }));
}

export function mapStaffToRecord(
  scope: StaffTenantScope,
  staff: StaffWithRelations,
  branchMeta: StoredStaffBranchMeta,
  departments: Department[],
  designations: Designation[],
  rolePermissions: Permission[] = [],
): StaffRecord {
  const profileMeta = parseProfileMeta(staff.staffProfile);
  const departmentName = staff.department ?? "General";
  const department =
    departments.find((entry) => entry.id === profileMeta.departmentId) ??
    departments.find((entry) => entry.name === departmentName) ??
    mapStringDepartment(scope, departmentName);
  const designationTitle = staff.jobTitle ?? "Team Member";
  const designation =
    designations.find((entry) => entry.id === profileMeta.designationId) ??
    designations.find(
      (entry) => entry.title === designationTitle && entry.departmentId === department.id,
    ) ??
    mapDesignation(scope, designationTitle, department.id);

  const member: StaffMember = {
    id: staff.id,
    tenantId: scope.tenantId,
    workspaceId: scope.workspaceId,
    businessId: scope.businessId,
    userId: staff.userId,
    employeeNumber: staff.employeeCode ?? `EMP-${staff.id.slice(0, 8).toUpperCase()}`,
    firstName: staff.firstName,
    lastName: staff.lastName,
    displayName: staff.fullName || `${staff.firstName} ${staff.lastName}`.trim(),
    email: staff.email ?? "",
    phone: staff.phone,
    avatarUrl: staff.avatar,
    employmentStatus: mapPrismaEmploymentStatus(staff.employmentStatus, staff.isActive),
    hireDate: iso(staff.hireDate).slice(0, 10),
    terminationDate: staff.terminationDate ? iso(staff.terminationDate).slice(0, 10) : null,
    isActive: staff.isActive,
    createdAt: iso(staff.createdAt),
    updatedAt: iso(staff.updatedAt),
  };

  const profile: EmployeeProfile = {
    staffId: staff.id,
    dateOfBirth: staff.dateOfBirth ? iso(staff.dateOfBirth).slice(0, 10) : null,
    nationalId: profileMeta.nationalId ?? null,
    address: profileMeta.address ?? null,
    city: profileMeta.city ?? null,
    postcode: profileMeta.postcode ?? null,
    country: profileMeta.country ?? "GB",
    departmentId: department.id,
    designationId: designation.id,
    managerStaffId: profileMeta.managerStaffId ?? null,
    bio: profileMeta.bio ?? null,
    preferredLanguage: profileMeta.preferredLanguage ?? "en-GB",
    timezone: profileMeta.timezone ?? "Europe/London",
  };

  const branchAssignments: BranchAssignment[] = staff.branchAssignments.map((assignment) => ({
    id: assignment.id,
    staffId: staff.id,
    branchId: assignment.branchId,
    branchName: assignment.branch.name,
    isPrimary: assignment.isPrimary,
    assignedAt: iso(assignment.createdAt),
    assignedByStaffId: scope.actorStaffId ?? scope.userId,
  }));

  if (branchAssignments.length === 0 && staff.branch) {
    branchAssignments.push({
      id: `${staff.id}-${staff.branch.id}`,
      staffId: staff.id,
      branchId: staff.branch.id,
      branchName: staff.branch.name,
      isPrimary: true,
      assignedAt: iso(staff.createdAt),
      assignedByStaffId: scope.actorStaffId ?? scope.userId,
    });
  }

  const roleAssignments: RoleAssignment[] = staff.staffRoles.map((entry) => ({
    id: entry.id,
    staffId: staff.id,
    roleId: entry.role.id,
    roleName: entry.role.name,
    scope: "business",
    scopeId: scope.businessId,
    assignedAt: iso(entry.createdAt),
    assignedByStaffId: scope.actorStaffId ?? scope.userId,
    expiresAt: null,
  }));

  const shifts = (branchMeta.shifts ?? []).filter((shift) => shift.staffId === staff.id);
  const schedules = (branchMeta.schedules ?? []).filter((schedule) => schedule.staffId === staff.id);
  const attendance = (branchMeta.attendance ?? []).filter((entry) => entry.staffId === staff.id);
  const leaveRequests = (branchMeta.leaveRequests ?? []).filter((entry) => entry.staffId === staff.id);
  const performanceReviews = (branchMeta.performanceReviews ?? []).filter(
    (entry) => entry.staffId === staff.id,
  );
  const trainingRecords = (branchMeta.trainingRecords ?? []).filter(
    (entry) => entry.staffId === staff.id,
  );
  const certifications = (branchMeta.certifications ?? []).filter(
    (entry) => entry.staffId === staff.id,
  );
  const documents = (branchMeta.documents ?? []).filter((entry) => entry.staffId === staff.id);

  const payroll: PayrollProfile = {
    staffId: staff.id,
    tenantId: scope.tenantId,
    businessId: scope.businessId,
    payFrequency: profileMeta.payFrequency ?? PAYROLL_FREQUENCIES.MONTHLY,
    hourlyRateCents: cents(staff.hourlyRate),
    salaryCents: cents(staff.monthlySalary),
    currency: "GBP",
    taxCode: profileMeta.taxCode ?? null,
    bankAccountLast4: profileMeta.bankAccountLast4 ?? null,
    isPayrollEnabled: profileMeta.isPayrollEnabled ?? true,
    effectiveFrom: iso(staff.hireDate).slice(0, 10),
  };

  const analytics = buildAnalytics(
    staff.id,
    attendance,
    leaveRequests,
    performanceReviews,
    trainingRecords,
  );
  const aiContext = buildAiContext(member, analytics, attendance);

  return {
    member,
    profile,
    department,
    designation,
    branchAssignments,
    roleAssignments,
    permissionAssignments: mapPermissionAssignments(scope, staff.id, rolePermissions),
    shifts,
    schedules,
    attendance,
    leaveRequests,
    payroll,
    performanceReviews,
    trainingRecords,
    certifications,
    emergencyContacts: buildEmergencyContacts(staff),
    documents,
    activityLog: mapAuditLogs(scope, staff.id, staff.auditLogs ?? []),
    analytics,
    aiContext,
  };
}

export function createScheduledShift(
  scope: StaffTenantScope,
  input: {
    staffId: string;
    branchId: string;
    shiftDate: string;
    startTime: string;
    endTime: string;
    breakMinutes?: number;
    roleId?: string;
    notes?: string;
  },
): StaffShift {
  const now = new Date().toISOString();
  return {
    id: createId("shift"),
    tenantId: scope.tenantId,
    businessId: scope.businessId,
    branchId: input.branchId,
    staffId: input.staffId,
    scheduleId: null,
    status: STAFF_SHIFT_STATUSES.SCHEDULED,
    shiftDate: input.shiftDate,
    startTime: input.startTime,
    endTime: input.endTime,
    breakMinutes: input.breakMinutes ?? 30,
    roleId: input.roleId ?? null,
    notes: input.notes ?? null,
    createdAt: now,
    updatedAt: now,
  };
}

export function createAttendanceRecord(
  scope: StaffTenantScope,
  input: {
    staffId: string;
    branchId: string;
    shiftId?: string | null;
    clockInAt: string;
    clockOutAt?: string | null;
    status?: AttendanceStatus;
  },
): Attendance {
  const workedMinutes = input.clockOutAt
    ? Math.max(
        0,
        Math.round(
          (new Date(input.clockOutAt).getTime() - new Date(input.clockInAt).getTime()) / 60_000,
        ),
      )
    : 0;

  return {
    id: createId("att"),
    staffId: input.staffId,
    shiftId: input.shiftId ?? null,
    tenantId: scope.tenantId,
    businessId: scope.businessId,
    branchId: input.branchId,
    status: input.status ?? ATTENDANCE_STATUSES.PRESENT,
    clockInAt: input.clockInAt,
    clockOutAt: input.clockOutAt ?? null,
    scheduledMinutes: 480,
    workedMinutes,
    overtimeMinutes: Math.max(0, workedMinutes - 480),
    attendanceDate: input.clockInAt.slice(0, 10),
    notes: null,
  };
}

export function createLeaveRequest(
  scope: StaffTenantScope,
  input: {
    staffId: string;
    branchId: string;
    leaveType: LeaveRequest["leaveType"];
    startDate: string;
    endDate: string;
    reason?: string | null;
  },
): LeaveRequest {
  const start = new Date(input.startDate);
  const end = new Date(input.endDate);
  const totalDays = Math.max(
    1,
    Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1,
  );
  const now = new Date().toISOString();

  return {
    id: createId("leave"),
    staffId: input.staffId,
    tenantId: scope.tenantId,
    businessId: scope.businessId,
    branchId: input.branchId,
    leaveType: input.leaveType,
    status: LEAVE_STATUSES.PENDING,
    startDate: input.startDate,
    endDate: input.endDate,
    totalDays,
    reason: input.reason ?? null,
    approvedByStaffId: null,
    approvedAt: null,
    rejectionReason: null,
    createdAt: now,
    updatedAt: now,
  };
}

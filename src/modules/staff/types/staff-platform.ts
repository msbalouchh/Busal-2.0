import type {
  AttendanceStatus,
  EmploymentStatus,
  LeaveStatus,
  LeaveType,
  PayrollFrequency,
  PerformanceRating,
  StaffActivityEventType,
  StaffDepartment,
  StaffShiftStatus,
  TrainingStatus,
} from "@/modules/staff/constants/staff-status";

/** Core staff member identity within tenant scope. */
export interface StaffMember {
  id: string;
  tenantId: string;
  workspaceId: string;
  businessId: string;
  userId: string | null;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  employmentStatus: EmploymentStatus;
  hireDate: string;
  terminationDate: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Extended employee profile with HR details. */
export interface EmployeeProfile {
  staffId: string;
  dateOfBirth: string | null;
  nationalId: string | null;
  address: string | null;
  city: string | null;
  postcode: string | null;
  country: string;
  departmentId: string;
  designationId: string;
  managerStaffId: string | null;
  bio: string | null;
  preferredLanguage: string;
  timezone: string;
}

/** Organisational department. */
export interface Department {
  id: string;
  tenantId: string;
  businessId: string;
  name: string;
  departmentType: StaffDepartment;
  customLabel: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Job title / designation within a department. */
export interface Designation {
  id: string;
  tenantId: string;
  businessId: string;
  departmentId: string;
  title: string;
  level: number;
  description: string | null;
  isActive: boolean;
}

/** Work shift instance. */
export interface StaffShift {
  id: string;
  tenantId: string;
  businessId: string;
  branchId: string;
  staffId: string;
  scheduleId: string | null;
  status: StaffShiftStatus;
  shiftDate: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  roleId: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Recurring or planned shift schedule template. */
export interface ShiftSchedule {
  id: string;
  tenantId: string;
  businessId: string;
  branchId: string;
  name: string;
  staffId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isRecurring: boolean;
  effectiveFrom: string;
  effectiveTo: string | null;
  isActive: boolean;
}

/** Clock-in/out attendance record. */
export interface Attendance {
  id: string;
  staffId: string;
  shiftId: string | null;
  tenantId: string;
  businessId: string;
  branchId: string;
  status: AttendanceStatus;
  clockInAt: string | null;
  clockOutAt: string | null;
  scheduledMinutes: number;
  workedMinutes: number;
  overtimeMinutes: number;
  attendanceDate: string;
  notes: string | null;
}

/** Leave / time-off request. */
export interface LeaveRequest {
  id: string;
  staffId: string;
  tenantId: string;
  businessId: string;
  branchId: string;
  leaveType: LeaveType;
  status: LeaveStatus;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string | null;
  approvedByStaffId: string | null;
  approvedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Payroll configuration (payroll-ready, no processing). */
export interface PayrollProfile {
  staffId: string;
  tenantId: string;
  businessId: string;
  payFrequency: PayrollFrequency;
  hourlyRateCents: number | null;
  salaryCents: number | null;
  currency: string;
  taxCode: string | null;
  bankAccountLast4: string | null;
  isPayrollEnabled: boolean;
  effectiveFrom: string;
}

/** Performance review record. */
export interface PerformanceReview {
  id: string;
  staffId: string;
  tenantId: string;
  businessId: string;
  reviewerStaffId: string;
  reviewPeriodStart: string;
  reviewPeriodEnd: string;
  rating: PerformanceRating;
  scoreBps: number;
  strengths: string[];
  improvements: string[];
  goals: string[];
  notes: string | null;
  completedAt: string;
}

/** Training course completion record. */
export interface TrainingRecord {
  id: string;
  staffId: string;
  tenantId: string;
  businessId: string;
  courseName: string;
  provider: string;
  status: TrainingStatus;
  startedAt: string | null;
  completedAt: string | null;
  expiresAt: string | null;
  certificateId: string | null;
}

/** Professional certification. */
export interface Certification {
  id: string;
  staffId: string;
  name: string;
  issuingBody: string;
  certificateNumber: string;
  issuedAt: string;
  expiresAt: string | null;
  documentId: string | null;
  isVerified: boolean;
}

/** Emergency contact for staff member. */
export interface EmergencyContact {
  id: string;
  staffId: string;
  name: string;
  relationship: string;
  phone: string;
  email: string | null;
  isPrimary: boolean;
}

/** HR document reference (storage-ready). */
export interface StaffDocument {
  id: string;
  staffId: string;
  tenantId: string;
  businessId: string;
  documentType: "contract" | "id" | "certification" | "review" | "other";
  fileName: string;
  fileUrl: string | null;
  uploadedAt: string;
  uploadedByStaffId: string;
  expiresAt: string | null;
}

/** Branch assignment for multi-branch staff. */
export interface BranchAssignment {
  id: string;
  staffId: string;
  branchId: string;
  branchName: string;
  isPrimary: boolean;
  assignedAt: string;
  assignedByStaffId: string;
}

/** RBAC role assignment. */
export interface RoleAssignment {
  id: string;
  staffId: string;
  roleId: string;
  roleName: string;
  scope: "tenant" | "business" | "branch";
  scopeId: string;
  assignedAt: string;
  assignedByStaffId: string;
  expiresAt: string | null;
}

/** Granular permission assignment. */
export interface PermissionAssignment {
  id: string;
  staffId: string;
  permission: string;
  scope: "tenant" | "business" | "branch";
  scopeId: string;
  grantedAt: string;
  grantedByStaffId: string;
}

/** Audit activity log entry. */
export interface StaffActivityLog {
  id: string;
  staffId: string;
  tenantId: string;
  businessId: string;
  eventType: StaffActivityEventType;
  actorStaffId: string | null;
  message: string;
  metadata: Record<string, string | number | boolean | null>;
  occurredAt: string;
}

/** Workforce performance metrics. */
export interface StaffAnalytics {
  staffId: string;
  attendanceRateBps: number;
  punctualityRateBps: number;
  overtimeHoursMonth: number;
  leaveDaysUsed: number;
  leaveDaysRemaining: number;
  avgPerformanceScoreBps: number;
  trainingCompletionRateBps: number;
  shiftCoverageRateBps: number;
}

/** AI-enriched context for workforce intelligence. */
export interface StaffAiContext {
  staffId: string;
  summary: string;
  labourDemandScore: number;
  staffingGapHours: number;
  attendanceRiskScore: number;
  performanceTrend: "improving" | "stable" | "declining";
  recommendedShiftHours: number;
  insights: string[];
  recommendedActions: string[];
  lastGeneratedAt: string;
}

/** Full staff aggregate — single source of truth. */
export interface StaffRecord {
  member: StaffMember;
  profile: EmployeeProfile;
  department: Department;
  designation: Designation;
  branchAssignments: BranchAssignment[];
  roleAssignments: RoleAssignment[];
  permissionAssignments: PermissionAssignment[];
  shifts: StaffShift[];
  schedules: ShiftSchedule[];
  attendance: Attendance[];
  leaveRequests: LeaveRequest[];
  payroll: PayrollProfile;
  performanceReviews: PerformanceReview[];
  trainingRecords: TrainingRecord[];
  certifications: Certification[];
  emergencyContacts: EmergencyContact[];
  documents: StaffDocument[];
  activityLog: StaffActivityLog[];
  analytics: StaffAnalytics;
  aiContext: StaffAiContext;
}

export interface StaffSearchQuery {
  query?: string;
  tenantId?: string;
  businessId?: string;
  branchId?: string;
  departmentId?: string;
  employmentStatus?: EmploymentStatus;
  departmentType?: StaffDepartment;
  roleId?: string;
  isActive?: boolean;
  limit?: number;
}

export interface CreateEmployeeInput {
  branchId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  departmentId: string;
  designationId: string;
  hireDate: string;
  hourlyRateCents?: number;
  salaryCents?: number;
}

export interface AssignRoleInput {
  staffId: string;
  roleId: string;
  roleName: string;
  scope: RoleAssignment["scope"];
  scopeId: string;
  assignedByStaffId: string;
}

export interface ScheduleShiftInput {
  staffId: string;
  branchId: string;
  shiftDate: string;
  startTime: string;
  endTime: string;
  breakMinutes?: number;
  roleId?: string;
  notes?: string;
}

export interface ApproveLeaveInput {
  leaveRequestId: string;
  approvedByStaffId: string;
}

export interface StaffPlatformContext {
  tenantId: string;
  workspaceId: string;
  businessId: string;
  branchId: string;
  userId: string;
}

export interface StaffContextValue {
  context: StaffPlatformContext;
  records: StaffRecord[];
  departments: Department[];
  designations: Designation[];
  selectedStaffId: string | null;
  selectedStaff: StaffRecord | null;
  selectStaff: (staffId: string | null) => void;
  searchStaff: (query: StaffSearchQuery) => StaffRecord[];
  refresh: () => void;
}

export interface StaffScheduleContextValue {
  shifts: StaffShift[];
  schedules: ShiftSchedule[];
  upcomingShifts: StaffShift[];
  refresh: () => void;
}

export interface StaffAttendanceContextValue {
  attendance: Attendance[];
  presentTodayCount: number;
  absentTodayCount: number;
  lateTodayCount: number;
  refresh: () => void;
}

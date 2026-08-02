import type {
  StaffAccountStatus,
  StaffAuditEventType,
  StaffEmploymentStatus,
  StaffInvitationStatus,
  StaffSalaryType,
} from "@prisma/client";

import type {
  BranchData,
  PermissionData,
  RoleData,
  RolePermissionMatrix,
  StaffData,
} from "@/services/staff-management.service";

export interface StaffEmergencyContact {
  name: string;
  phone: string;
  relationship: string;
}

export interface StaffProfileDetails {
  notes: string;
  avatarUrl: string | null;
  emergencyContact: StaffEmergencyContact;
}

export interface StaffBranchAssignmentData {
  branchId: string;
  branchName: string;
  isPrimary: boolean;
}

export interface SerializedStaffMember extends StaffData {
  employeeCode: string | null;
  fullName: string;
  avatar: string | null;
  department: string | null;
  jobTitle: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  hireDate: string | null;
  terminationDate: string | null;
  salaryType: StaffSalaryType | null;
  hourlyRate: number | null;
  monthlySalary: number | null;
  employmentStatus: StaffEmploymentStatus;
  accountStatus: StaffAccountStatus;
  lastLoginAt: string | null;
  forcePasswordReset: boolean;
  profile: StaffProfileDetails;
  branchAssignments: StaffBranchAssignmentData[];
  mfaEnabled: boolean;
  activeSessionCount: number;
}

export interface StaffInvitationData {
  id: string;
  email: string;
  roleId: string | null;
  roleName: string | null;
  branchIds: string[];
  defaultBranchId: string | null;
  status: StaffInvitationStatus;
  expiresAt: string;
  createdAt: string;
}

export interface StaffAuditEntry {
  id: string;
  staffId: string | null;
  eventType: StaffAuditEventType;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface StaffDirectoryQuery {
  search?: string;
  branchId?: string | null;
  roleId?: string | null;
  department?: string | null;
  employmentStatus?: StaffEmploymentStatus | null;
  accountStatus?: StaffAccountStatus | null;
  isActive?: boolean | null;
  sortBy?: "name" | "department" | "role" | "createdAt";
  sortDirection?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface StaffDirectoryResult {
  items: SerializedStaffMember[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface StaffManagementPermissions {
  canView: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canManageRoles: boolean;
  canManagePermissions: boolean;
  canInvite: boolean;
  canManageSecurity: boolean;
}

export interface StaffManagementBundle {
  members: SerializedStaffMember[];
  directory: StaffDirectoryResult;
  roles: RoleData[];
  permissions: PermissionData[];
  branches: BranchData[];
  invitations: StaffInvitationData[];
  permissionMatrix: RolePermissionMatrix;
  auditLogs: StaffAuditEntry[];
  permissionsFlags: StaffManagementPermissions;
}

export interface StaffProfileInput {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  employeeCode?: string;
  department?: string;
  jobTitle?: string;
  employmentStatus?: StaffEmploymentStatus;
  avatar?: string;
  dateOfBirth?: string | null;
  gender?: string;
  hireDate?: string | null;
  terminationDate?: string | null;
  salaryType?: StaffSalaryType | null;
  hourlyRate?: number | null;
  monthlySalary?: number | null;
  branchId?: string | null;
  roleId?: string | null;
  roleIds?: string[];
  branchIds?: string[];
  primaryBranchId?: string | null;
  defaultBranchId?: string | null;
  isActive?: boolean;
  profile?: Partial<StaffProfileDetails>;
}

export interface StaffInvitationInput {
  email: string;
  roleId?: string | null;
  branchIds?: string[];
  defaultBranchId?: string | null;
}

export interface BulkStaffUpdateInput {
  staffIds: string[];
  roleId?: string | null;
  branchId?: string | null;
  defaultBranchId?: string | null;
  isActive?: boolean;
  employmentStatus?: StaffEmploymentStatus;
}

export interface BulkInviteInput {
  invitations: StaffInvitationInput[];
}

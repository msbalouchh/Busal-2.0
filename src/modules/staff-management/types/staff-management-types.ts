import type { StaffEmploymentStatus, StaffSalaryType } from "@prisma/client";

import type { StaffEmergencyContact } from "@/modules/staff/types/staff-management-types";
import type { SerializedStaffMember } from "@/modules/staff/types/staff-management-types";

export type StaffStatusFilter = "ALL" | "ACTIVE" | "ARCHIVED" | StaffEmploymentStatus;

export interface StaffListQuery {
  search?: string;
  branchId?: string;
  roleId?: string;
  department?: string;
  status?: StaffStatusFilter;
  page?: number;
  pageSize?: number;
}

export interface StaffListResult {
  items: SerializedStaffMember[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface StaffManagementInput {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  employeeCode?: string;
  jobTitle?: string;
  department?: string;
  employmentStatus?: StaffEmploymentStatus;
  avatar?: string;
  dateOfBirth?: string | null;
  gender?: string;
  hireDate?: string | null;
  terminationDate?: string | null;
  salaryType?: StaffSalaryType | null;
  hourlyRate?: number | null;
  monthlySalary?: number | null;
  emergencyContact?: Partial<StaffEmergencyContact>;
  notes?: string;
  roleIds?: string[];
  branchIds?: string[];
  primaryBranchId?: string | null;
}

export interface StaffRoleAssignmentInput {
  staffId: string;
  roleIds: string[];
}

export interface StaffBranchAssignmentInput {
  staffId: string;
  branchIds: string[];
  primaryBranchId?: string | null;
}

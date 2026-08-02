"use server";

import { revalidatePath } from "next/cache";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { STAFF_MANAGEMENT_ROUTES } from "@/modules/staff-management/constants/routes";
import { requireStaffActionContext } from "@/modules/staff-management/lib/get-staff-management-context";
import {
  buildStaffFullName,
  normalizeEmployeeCode,
  validateStaffInput,
} from "@/modules/staff-management/lib/staff-validation";
import type {
  StaffBranchAssignmentInput,
  StaffManagementInput,
  StaffRoleAssignmentInput,
} from "@/modules/staff-management/types/staff-management-types";
import type { StaffProfileInput } from "@/modules/staff/types/staff-management-types";
import { requireBusinessContext } from "@/modules/business-context/services/business-context.service";
import {
  archiveStaffMember,
  assignStaffMemberBranches,
  assignStaffMemberRoles,
  createStaffMemberProfile,
  restoreStaffMember,
  updateStaffMemberProfile,
} from "@/services/staff-management-module.service";

function revalidateStaffPages(staffId?: string) {
  revalidatePath(STAFF_MANAGEMENT_ROUTES.list);
  revalidatePath(STAFF_MANAGEMENT_ROUTES.create);

  if (staffId) {
    revalidatePath(STAFF_MANAGEMENT_ROUTES.details(staffId));
    revalidatePath(STAFF_MANAGEMENT_ROUTES.edit(staffId));
  }
}

function mapStaffInput(input: StaffManagementInput): StaffProfileInput {
  return {
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    phone: input.phone,
    employeeCode: input.employeeCode ? normalizeEmployeeCode(input.employeeCode) : undefined,
    department: input.department,
    jobTitle: input.jobTitle,
    employmentStatus: input.employmentStatus,
    avatar: input.avatar,
    dateOfBirth: input.dateOfBirth,
    gender: input.gender,
    hireDate: input.hireDate,
    terminationDate: input.terminationDate,
    salaryType: input.salaryType,
    hourlyRate: input.hourlyRate,
    monthlySalary: input.monthlySalary,
    roleIds: input.roleIds,
    branchIds: input.branchIds,
    primaryBranchId: input.primaryBranchId,
    profile: {
      notes: input.notes,
      avatarUrl: input.avatar ?? null,
      emergencyContact: {
        name: input.emergencyContact?.name ?? "",
        phone: input.emergencyContact?.phone ?? "",
        relationship: input.emergencyContact?.relationship ?? "",
      },
    },
  };
}

export async function createStaffManagementAction(input: StaffManagementInput) {
  await requireStaffActionContext(PERMISSION_CODES.STAFF_CREATE);
  validateStaffInput(input);
  const platform = await requireBusinessContext();
  const member = await createStaffMemberProfile(platform, mapStaffInput(input));
  revalidateStaffPages(member.id);
  return { success: true as const, staffId: member.id };
}

export async function updateStaffManagementAction(staffId: string, input: StaffManagementInput) {
  await requireStaffActionContext(PERMISSION_CODES.STAFF_UPDATE);
  validateStaffInput(input);
  const platform = await requireBusinessContext();
  await updateStaffMemberProfile(platform, staffId, mapStaffInput(input));
  revalidateStaffPages(staffId);
  return { success: true as const };
}

export async function archiveStaffManagementAction(staffId: string) {
  await requireStaffActionContext(PERMISSION_CODES.STAFF_DELETE);
  const platform = await requireBusinessContext();
  await archiveStaffMember(platform, staffId);
  revalidateStaffPages(staffId);
  return { success: true as const };
}

export async function restoreStaffManagementAction(staffId: string) {
  await requireStaffActionContext(PERMISSION_CODES.STAFF_UPDATE);
  const platform = await requireBusinessContext();
  await restoreStaffMember(platform, staffId);
  revalidateStaffPages(staffId);
  return { success: true as const };
}

export async function assignStaffRolesManagementAction(input: StaffRoleAssignmentInput) {
  await requireStaffActionContext(PERMISSION_CODES.STAFF_ASSIGN_ROLE);
  const platform = await requireBusinessContext();
  await assignStaffMemberRoles(platform, input.staffId, input.roleIds);
  revalidateStaffPages(input.staffId);
  return { success: true as const };
}

export async function assignStaffBranchesManagementAction(input: StaffBranchAssignmentInput) {
  await requireStaffActionContext(PERMISSION_CODES.STAFF_ASSIGN_BRANCH);
  const platform = await requireBusinessContext();
  await assignStaffMemberBranches(platform, input.staffId, input.branchIds, input.primaryBranchId);
  revalidateStaffPages(input.staffId);
  return { success: true as const };
}

export { buildStaffFullName, normalizeEmployeeCode };

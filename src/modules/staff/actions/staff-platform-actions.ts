"use server";

import { revalidatePath } from "next/cache";

import { STAFF_MODULE_PERMISSIONS } from "@/modules/staff/constants/permissions";
import { STAFF_PLATFORM_ROUTES } from "@/modules/staff/constants/platform-routes";
import { resolveStaffScope, toStaffPlatformContext } from "@/modules/staff/lib/staff-scope";
import { protectedAction } from "@/modules/platform-guards/guards/action.guards";
import { staffService } from "@/modules/staff/services/staff.service";
import {
  approveStaffLeaveSchema,
  assignStaffBranchSchema,
  assignStaffRoleSchema,
  clockStaffActionSchema,
  createStaffEmployeeSchema,
  createStaffLeaveSchema,
  scheduleStaffShiftSchema,
  staffBulkActionSchema,
  staffMemberActionSchema,
  updateStaffEmployeeSchema,
} from "@/modules/staff/validation/staff-schemas";

function revalidateStaffPlatformPaths() {
  Object.values(STAFF_PLATFORM_ROUTES).forEach((path) => revalidatePath(path));
}

export async function createStaffPlatformEmployeeAction(input: unknown) {
  return protectedAction(STAFF_MODULE_PERMISSIONS.STAFF_CREATE, async ({ platform }) => {
    const body = createStaffEmployeeSchema.parse(input);
    const context = toStaffPlatformContext(resolveStaffScope(platform));
    const record = await staffService.createEmployee(context, body);
    revalidateStaffPlatformPaths();
    return { success: true as const, record };
  });
}

export async function updateStaffPlatformEmployeeAction(input: unknown) {
  return protectedAction(STAFF_MODULE_PERMISSIONS.STAFF_UPDATE, async ({ platform }) => {
    const body = updateStaffEmployeeSchema.parse(input);
    const context = toStaffPlatformContext(resolveStaffScope(platform));
    const record = await staffService.updateEmployee(context, body);
    revalidateStaffPlatformPaths();
    return { success: true as const, record };
  });
}

export async function deactivateStaffPlatformEmployeeAction(input: unknown) {
  return protectedAction(STAFF_MODULE_PERMISSIONS.STAFF_DELETE, async ({ platform }) => {
    const body = staffMemberActionSchema.parse(input);
    const context = toStaffPlatformContext(resolveStaffScope(platform));
    const record = await staffService.deactivateEmployee(context, body.staffId);
    revalidateStaffPlatformPaths();
    return { success: true as const, record };
  });
}

export async function restoreStaffPlatformEmployeeAction(input: unknown) {
  return protectedAction(STAFF_MODULE_PERMISSIONS.STAFF_UPDATE, async ({ platform }) => {
    const body = staffMemberActionSchema.parse(input);
    const context = toStaffPlatformContext(resolveStaffScope(platform));
    const record = await staffService.restoreEmployee(context, body.staffId);
    revalidateStaffPlatformPaths();
    return { success: true as const, record };
  });
}

export async function bulkStaffPlatformAction(input: unknown) {
  return protectedAction(STAFF_MODULE_PERMISSIONS.STAFF_MANAGE, async ({ platform }) => {
    const body = staffBulkActionSchema.parse(input);
    const context = toStaffPlatformContext(resolveStaffScope(platform));
    const affected = await staffService.bulkAction(context, body);
    revalidateStaffPlatformPaths();
    return { success: true as const, affected };
  });
}

export async function assignStaffPlatformRoleAction(input: unknown) {
  return protectedAction(STAFF_MODULE_PERMISSIONS.STAFF_MANAGE, async ({ platform }) => {
    const body = assignStaffRoleSchema.parse(input);
    const context = toStaffPlatformContext(resolveStaffScope(platform));
    const record = await staffService.assignRole(context, {
      ...body,
      assignedByStaffId: resolveStaffScope(platform).actorStaffId ?? context.userId,
    });
    revalidateStaffPlatformPaths();
    return { success: true as const, record };
  });
}

export async function assignStaffPlatformBranchAction(input: unknown) {
  return protectedAction(STAFF_MODULE_PERMISSIONS.STAFF_MANAGE, async ({ platform }) => {
    const body = assignStaffBranchSchema.parse(input);
    const context = toStaffPlatformContext(resolveStaffScope(platform));
    const record = await staffService.assignBranch(context, body);
    revalidateStaffPlatformPaths();
    return { success: true as const, record };
  });
}

export async function scheduleStaffPlatformShiftAction(input: unknown) {
  return protectedAction(STAFF_MODULE_PERMISSIONS.STAFF_UPDATE, async ({ platform }) => {
    const body = scheduleStaffShiftSchema.parse(input);
    const context = toStaffPlatformContext(resolveStaffScope(platform));
    const shift = await staffService.scheduleShift(context, body);
    revalidateStaffPlatformPaths();
    return { success: true as const, shift };
  });
}

export async function clockInStaffPlatformAction(input: unknown) {
  return protectedAction(STAFF_MODULE_PERMISSIONS.STAFF_UPDATE, async ({ platform }) => {
    const body = clockStaffActionSchema.parse(input);
    const context = toStaffPlatformContext(resolveStaffScope(platform));
    const record = await staffService.clockIn(context, body);
    revalidateStaffPlatformPaths();
    return { success: true as const, record };
  });
}

export async function clockOutStaffPlatformAction(input: unknown) {
  return protectedAction(STAFF_MODULE_PERMISSIONS.STAFF_UPDATE, async ({ platform }) => {
    const body = clockStaffActionSchema.parse(input);
    const context = toStaffPlatformContext(resolveStaffScope(platform));
    const record = await staffService.clockOut(context, body);
    revalidateStaffPlatformPaths();
    return { success: true as const, record };
  });
}

export async function createStaffPlatformLeaveAction(input: unknown) {
  return protectedAction(STAFF_MODULE_PERMISSIONS.STAFF_UPDATE, async ({ platform }) => {
    const body = createStaffLeaveSchema.parse(input);
    const context = toStaffPlatformContext(resolveStaffScope(platform));
    const record = await staffService.createLeaveRequest(context, body);
    revalidateStaffPlatformPaths();
    return { success: true as const, record };
  });
}

export async function approveStaffPlatformLeaveAction(input: unknown) {
  return protectedAction(STAFF_MODULE_PERMISSIONS.STAFF_MANAGE, async ({ platform }) => {
    const body = approveStaffLeaveSchema.parse(input);
    const context = toStaffPlatformContext(resolveStaffScope(platform));
    const record = await staffService.approveLeave(context, {
      ...body,
      approvedByStaffId: resolveStaffScope(platform).actorStaffId ?? context.userId,
    });
    revalidateStaffPlatformPaths();
    return { success: true as const, record };
  });
}

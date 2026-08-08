import { z } from "zod";

import { EMPLOYMENT_STATUSES } from "@/modules/staff/constants/staff-status";

export const staffSearchSchema = z.object({
  query: z.string().trim().optional(),
  departmentId: z.string().trim().optional(),
  employmentStatus: z
    .enum([
      EMPLOYMENT_STATUSES.ACTIVE,
      EMPLOYMENT_STATUSES.INACTIVE,
      EMPLOYMENT_STATUSES.ON_LEAVE,
      EMPLOYMENT_STATUSES.SUSPENDED,
      EMPLOYMENT_STATUSES.TERMINATED,
    ])
    .optional(),
  departmentType: z.string().trim().optional(),
  roleId: z.string().trim().optional(),
  isActive: z.coerce.boolean().optional(),
  includeInactive: z.coerce.boolean().optional(),
  sortBy: z.enum(["name", "department", "createdAt", "role"]).optional(),
  sortDirection: z.enum(["asc", "desc"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export const createStaffEmployeeSchema = z.object({
  branchId: z.string().trim().min(1),
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  email: z.string().trim().email(),
  phone: z.string().trim().max(30).optional(),
  departmentId: z.string().trim().min(1),
  designationId: z.string().trim().min(1),
  hireDate: z.string().trim().min(1),
  hourlyRateCents: z.coerce.number().int().min(0).optional(),
  salaryCents: z.coerce.number().int().min(0).optional(),
  roleId: z.string().trim().optional(),
});

export const updateStaffEmployeeSchema = createStaffEmployeeSchema
  .partial()
  .extend({ staffId: z.string().trim().min(1) });

export const assignStaffRoleSchema = z.object({
  staffId: z.string().trim().min(1),
  roleId: z.string().trim().min(1),
  roleName: z.string().trim().min(1),
  scope: z.enum(["tenant", "business", "branch"]).default("branch"),
  scopeId: z.string().trim().min(1),
});

export const assignStaffBranchSchema = z.object({
  staffId: z.string().trim().min(1),
  branchId: z.string().trim().min(1),
  isPrimary: z.coerce.boolean().default(false),
});

export const scheduleStaffShiftSchema = z.object({
  staffId: z.string().trim().min(1),
  branchId: z.string().trim().min(1),
  shiftDate: z.string().trim().min(1),
  startTime: z.string().trim().min(1),
  endTime: z.string().trim().min(1),
  breakMinutes: z.coerce.number().int().min(0).optional(),
  roleId: z.string().trim().optional(),
  notes: z.string().trim().max(500).optional(),
});

export const clockStaffActionSchema = z.object({
  staffId: z.string().trim().min(1),
  branchId: z.string().trim().min(1),
  shiftId: z.string().trim().optional(),
  notes: z.string().trim().max(500).optional(),
});

export const approveStaffLeaveSchema = z.object({
  leaveRequestId: z.string().trim().min(1),
});

export const createStaffLeaveSchema = z.object({
  staffId: z.string().trim().min(1),
  branchId: z.string().trim().min(1),
  leaveType: z.enum(["annual", "sick", "unpaid", "maternity", "paternity", "bereavement", "other"]),
  startDate: z.string().trim().min(1),
  endDate: z.string().trim().min(1),
  reason: z.string().trim().max(500).optional(),
});

export const staffBulkActionSchema = z.object({
  staffIds: z.array(z.string().trim().min(1)).min(1).max(100),
  action: z.enum(["deactivate", "restore", "delete"]),
});

export const staffMemberActionSchema = z.object({
  staffId: z.string().trim().min(1),
});

export type StaffSearchSchemaInput = z.infer<typeof staffSearchSchema>;
export type CreateStaffEmployeeSchemaInput = z.infer<typeof createStaffEmployeeSchema>;
export type UpdateStaffEmployeeSchemaInput = z.infer<typeof updateStaffEmployeeSchema>;
export type AssignStaffRoleSchemaInput = z.infer<typeof assignStaffRoleSchema>;
export type AssignStaffBranchSchemaInput = z.infer<typeof assignStaffBranchSchema>;
export type ScheduleStaffShiftSchemaInput = z.infer<typeof scheduleStaffShiftSchema>;
export type ClockStaffActionSchemaInput = z.infer<typeof clockStaffActionSchema>;
export type ApproveStaffLeaveSchemaInput = z.infer<typeof approveStaffLeaveSchema>;
export type CreateStaffLeaveSchemaInput = z.infer<typeof createStaffLeaveSchema>;
export type StaffBulkActionSchemaInput = z.infer<typeof staffBulkActionSchema>;

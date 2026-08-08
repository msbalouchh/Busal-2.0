import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { ATTENDANCE_STATUSES, LEAVE_STATUSES } from "@/modules/staff/constants/staff-status";
import type { StaffTenantScope } from "@/modules/staff/lib/staff-scope";
import {
  createAttendanceRecord,
  createLeaveRequest,
  createScheduledShift,
  defaultBranchStaffMeta,
  mapDesignation,
  mapStaffToRecord,
  mapStringDepartment,
  mergeProfileMeta,
  type StaffWithRelations,
  type StoredStaffBranchMeta,
} from "@/modules/staff/lib/staff-mappers";
import type {
  ApproveLeaveInput,
  AssignRoleInput,
  CreateEmployeeInput,
  Department,
  Designation,
  ScheduleShiftInput,
  StaffRecord,
  StaffSearchQuery,
  StaffShift,
} from "@/modules/staff/types/staff-platform";
import type {
  ApproveStaffLeaveSchemaInput,
  AssignStaffBranchSchemaInput,
  AssignStaffRoleSchemaInput,
  ClockStaffActionSchemaInput,
  CreateStaffEmployeeSchemaInput,
  CreateStaffLeaveSchemaInput,
  ScheduleStaffShiftSchemaInput,
  StaffBulkActionSchemaInput,
  StaffSearchSchemaInput,
  UpdateStaffEmployeeSchemaInput,
} from "@/modules/staff/validation/staff-schemas";

const DEFAULT_PAGE_SIZE = 25;

const staffInclude = {
  branch: { select: { id: true, name: true } },
  staffRoles: {
    include: { role: { select: { id: true, name: true, slug: true } } },
  },
  branchAssignments: {
    include: { branch: { select: { id: true, name: true } } },
  },
  auditLogs: { orderBy: { createdAt: "desc" }, take: 20 },
} satisfies Prisma.StaffInclude;

export interface StaffSearchResult {
  records: StaffRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

function scopeWhere(scope: StaffTenantScope, includeInactive = false): Prisma.StaffWhereInput {
  return {
    businessId: scope.businessId,
    OR: [{ branchId: scope.branchId }, { branchAssignments: { some: { branchId: scope.branchId } } }],
    ...(includeInactive ? {} : { isActive: true, employmentStatus: { not: "TERMINATED" } }),
  };
}

function itemOrderBy(
  sortBy?: StaffSearchSchemaInput["sortBy"],
  sortDirection?: StaffSearchSchemaInput["sortDirection"],
): Prisma.StaffOrderByWithRelationInput {
  const direction = sortDirection === "desc" ? "desc" : "asc";
  switch (sortBy) {
    case "department":
      return { department: direction };
    case "createdAt":
      return { createdAt: direction };
    case "role":
      return { staffRoles: { _count: direction } };
    case "name":
    default:
      return { lastName: direction };
  }
}

async function loadRolePermissions(staff: StaffWithRelations) {
  const roleIds = staff.staffRoles.map((entry) => entry.roleId);
  if (roleIds.length === 0) {
    return [];
  }

  const assignments = await prisma.rolePermission.findMany({
    where: { roleId: { in: roleIds } },
    include: { permission: true },
  });

  const seen = new Set<string>();
  return assignments
    .map((entry) => entry.permission)
    .filter((permission) => {
      if (seen.has(permission.id)) {
        return false;
      }
      seen.add(permission.id);
      return true;
    });
}

/** Prisma-backed staff repository with tenant scoping. */
export class StaffRepository {
  private async loadBranchMeta(scope: StaffTenantScope): Promise<StoredStaffBranchMeta> {
    const settings = await prisma.branchSettings.findUnique({
      where: { branchId: scope.branchId },
      select: { settings: true },
    });

    const raw = settings?.settings;
    if (raw && typeof raw === "object" && raw !== null && "staffOperations" in raw) {
      return (raw as unknown as { staffOperations: StoredStaffBranchMeta }).staffOperations;
    }

    return defaultBranchStaffMeta(scope);
  }

  private async saveBranchMeta(scope: StaffTenantScope, meta: StoredStaffBranchMeta): Promise<void> {
    const existing = await prisma.branchSettings.findUnique({
      where: { branchId: scope.branchId },
      select: { settings: true },
    });

    const settingsObject =
      existing?.settings && typeof existing.settings === "object" && existing.settings !== null
        ? (existing.settings as Record<string, unknown>)
        : {};

    await prisma.branchSettings.upsert({
      where: { branchId: scope.branchId },
      create: {
        branchId: scope.branchId,
        settings: { ...settingsObject, staffOperations: meta } as unknown as Prisma.InputJsonValue,
      },
      update: {
        settings: { ...settingsObject, staffOperations: meta } as unknown as Prisma.InputJsonValue,
      },
    });
  }

  private async loadDepartments(scope: StaffTenantScope): Promise<Department[]> {
    const meta = await this.loadBranchMeta(scope);
    const departments = [...(meta.departments ?? [])];
    const staffDepartments = await prisma.staff.findMany({
      where: { businessId: scope.businessId, department: { not: null } },
      select: { department: true },
      distinct: ["department"],
    });

    for (const entry of staffDepartments) {
      if (!entry.department) continue;
      const mapped = mapStringDepartment(scope, entry.department);
      if (!departments.some((department) => department.id === mapped.id)) {
        departments.push(mapped);
      }
    }

    return departments;
  }

  private async loadDesignations(
    scope: StaffTenantScope,
    departments: Department[],
  ): Promise<Designation[]> {
    const meta = await this.loadBranchMeta(scope);
    const designations = [...(meta.designations ?? [])];
    const staffTitles = await prisma.staff.findMany({
      where: { businessId: scope.businessId, jobTitle: { not: null } },
      select: { jobTitle: true, department: true },
      distinct: ["jobTitle", "department"],
    });

    for (const entry of staffTitles) {
      if (!entry.jobTitle) continue;
      const department =
        departments.find((item) => item.name === (entry.department ?? "General")) ??
        mapStringDepartment(scope, entry.department ?? "General");
      const mapped = mapDesignation(scope, entry.jobTitle, department.id);
      if (!designations.some((designation) => designation.id === mapped.id)) {
        designations.push(mapped);
      }
    }

    return designations;
  }

  private async buildRecord(scope: StaffTenantScope, staffId: string): Promise<StaffRecord | null> {
    const staff = await prisma.staff.findFirst({
      where: { id: staffId, businessId: scope.businessId },
      include: staffInclude,
    });

    if (!staff) {
      return null;
    }

    const [branchMeta, departments, designations, permissions] = await Promise.all([
      this.loadBranchMeta(scope),
      this.loadDepartments(scope),
      this.loadDesignations(scope, await this.loadDepartments(scope)),
      loadRolePermissions(staff as StaffWithRelations),
    ]);

    return mapStaffToRecord(
      scope,
      staff as StaffWithRelations,
      branchMeta,
      departments,
      designations,
      permissions,
    );
  }

  async listRecords(scope: StaffTenantScope): Promise<StaffRecord[]> {
    const result = await this.search(scope, { page: 1, pageSize: 500 });
    return result.records;
  }

  async search(
    scope: StaffTenantScope,
    query: StaffSearchQuery | StaffSearchSchemaInput = {},
  ): Promise<StaffSearchResult> {
    const page = "page" in query && query.page ? query.page : 1;
    const pageSize =
      "limit" in query && query.limit
        ? query.limit
        : "pageSize" in query && query.pageSize
          ? query.pageSize
          : DEFAULT_PAGE_SIZE;

    const where: Prisma.StaffWhereInput = {
      ...scopeWhere(scope, "includeInactive" in query ? query.includeInactive : false),
    };

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    if (query.roleId) {
      where.staffRoles = { some: { roleId: query.roleId } };
    }

    if (query.departmentId) {
      const departments = await this.loadDepartments(scope);
      const department = departments.find((entry) => entry.id === query.departmentId);
      if (department) {
        where.department = department.name;
      }
    }

    if (query.query) {
      where.AND = [
        {
          OR: [
            { firstName: { contains: query.query, mode: "insensitive" } },
            { lastName: { contains: query.query, mode: "insensitive" } },
            { email: { contains: query.query, mode: "insensitive" } },
            { employeeCode: { contains: query.query, mode: "insensitive" } },
            { fullName: { contains: query.query, mode: "insensitive" } },
            { department: { contains: query.query, mode: "insensitive" } },
            { jobTitle: { contains: query.query, mode: "insensitive" } },
          ],
        },
      ];
    }

    const [branchMeta, departments, designations, total, staffMembers] = await Promise.all([
      this.loadBranchMeta(scope),
      this.loadDepartments(scope),
      this.loadDesignations(scope, await this.loadDepartments(scope)),
      prisma.staff.count({ where }),
      prisma.staff.findMany({
        where,
        include: staffInclude,
        orderBy: itemOrderBy(
          "sortBy" in query ? query.sortBy : undefined,
          "sortDirection" in query ? query.sortDirection : undefined,
        ),
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    let records = await Promise.all(
      staffMembers.map(async (staff) => {
        const permissions = await loadRolePermissions(staff as StaffWithRelations);
        return mapStaffToRecord(
          scope,
          staff as StaffWithRelations,
          branchMeta,
          departments,
          designations,
          permissions,
        );
      }),
    );

    if (query.employmentStatus) {
      records = records.filter((record) => record.member.employmentStatus === query.employmentStatus);
    }

    if (query.departmentType) {
      records = records.filter((record) => record.department.departmentType === query.departmentType);
    }

    return {
      records,
      total:
        query.employmentStatus || query.departmentType ? records.length : total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  async findById(scope: StaffTenantScope, staffId: string): Promise<StaffRecord | null> {
    return this.buildRecord(scope, staffId);
  }

  async listDepartments(scope: StaffTenantScope): Promise<Department[]> {
    return this.loadDepartments(scope);
  }

  async listDesignations(scope: StaffTenantScope): Promise<Designation[]> {
    const departments = await this.loadDepartments(scope);
    return this.loadDesignations(scope, departments);
  }

  async createEmployee(
    scope: StaffTenantScope,
    input: CreateEmployeeInput | CreateStaffEmployeeSchemaInput,
  ): Promise<StaffRecord> {
    const departments = await this.loadDepartments(scope);
    const designations = await this.loadDesignations(scope, departments);
    const department =
      departments.find((entry) => entry.id === input.departmentId) ??
      mapStringDepartment(scope, input.departmentId);
    const designation =
      designations.find((entry) => entry.id === input.designationId) ??
      mapDesignation(scope, input.designationId, department.id);

    const count = await prisma.staff.count({ where: { businessId: scope.businessId } });
    const employeeCode = `EMP-${String(count + 1).padStart(4, "0")}`;
    const fullName = `${input.firstName} ${input.lastName}`.trim();
    const staffProfile = mergeProfileMeta({}, {
      departmentId: department.id,
      designationId: designation.id,
    });

    const staff = await prisma.staff.create({
      data: {
        businessId: scope.businessId,
        branchId: input.branchId,
        firstName: input.firstName,
        lastName: input.lastName,
        fullName,
        email: input.email,
        phone: input.phone ?? null,
        employeeCode,
        department: department.name,
        jobTitle: designation.title,
        hireDate: new Date(input.hireDate),
        hourlyRate: input.hourlyRateCents ? input.hourlyRateCents / 100 : null,
        monthlySalary: input.salaryCents ? input.salaryCents / 100 : null,
        salaryType: input.hourlyRateCents ? "HOURLY" : input.salaryCents ? "MONTHLY" : null,
        staffProfile: staffProfile as unknown as Prisma.InputJsonValue,
        employmentStatus: "ACTIVE",
        accountStatus: "ACTIVE",
        isActive: true,
      },
      include: staffInclude,
    });

    await prisma.staffBranchAssignment.create({
      data: {
        staffId: staff.id,
        branchId: input.branchId,
        isPrimary: true,
      },
    });

    if ("roleId" in input && input.roleId) {
      await prisma.staffRole.create({
        data: { staffId: staff.id, roleId: input.roleId },
      });
    }

    await prisma.staffAuditLog.create({
      data: {
        businessId: scope.businessId,
        staffId: staff.id,
        eventType: "CREATED",
        actorUserId: scope.userId,
        actorStaffId: scope.actorStaffId,
      },
    });

    const record = await this.buildRecord(scope, staff.id);
    if (!record) {
      throw new Error("Failed to load created staff member");
    }
    return record;
  }

  async updateEmployee(
    scope: StaffTenantScope,
    input: UpdateStaffEmployeeSchemaInput,
  ): Promise<StaffRecord | null> {
    const existing = await prisma.staff.findFirst({
      where: { id: input.staffId, businessId: scope.businessId },
    });

    if (!existing) {
      return null;
    }

    const departments = await this.loadDepartments(scope);
    const designations = await this.loadDesignations(scope, departments);
    const department =
      input.departmentId !== undefined
        ? (departments.find((entry) => entry.id === input.departmentId) ??
          mapStringDepartment(scope, input.departmentId))
        : null;
    const designation =
      input.designationId !== undefined
        ? (designations.find((entry) => entry.id === input.designationId) ??
          mapDesignation(scope, input.designationId, department?.id ?? "dept-general"))
        : null;

    await prisma.staff.update({
      where: { id: existing.id },
      data: {
        ...(input.firstName !== undefined ? { firstName: input.firstName } : {}),
        ...(input.lastName !== undefined ? { lastName: input.lastName } : {}),
        ...(input.firstName !== undefined || input.lastName !== undefined
          ? {
              fullName: `${input.firstName ?? existing.firstName} ${input.lastName ?? existing.lastName}`.trim(),
            }
          : {}),
        ...(input.email !== undefined ? { email: input.email } : {}),
        ...(input.phone !== undefined ? { phone: input.phone ?? null } : {}),
        ...(department ? { department: department.name } : {}),
        ...(designation ? { jobTitle: designation.title } : {}),
        ...(input.hireDate !== undefined ? { hireDate: new Date(input.hireDate) } : {}),
        ...(input.hourlyRateCents !== undefined
          ? { hourlyRate: input.hourlyRateCents / 100, salaryType: "HOURLY" }
          : {}),
        ...(input.salaryCents !== undefined
          ? { monthlySalary: input.salaryCents / 100, salaryType: "MONTHLY" }
          : {}),
        staffProfile: mergeProfileMeta(existing.staffProfile, {
          ...(department ? { departmentId: department.id } : {}),
          ...(designation ? { designationId: designation.id } : {}),
        }) as unknown as Prisma.InputJsonValue,
      },
    });

    await prisma.staffAuditLog.create({
      data: {
        businessId: scope.businessId,
        staffId: existing.id,
        eventType: "UPDATED",
        actorUserId: scope.userId,
        actorStaffId: scope.actorStaffId,
      },
    });

    return this.buildRecord(scope, existing.id);
  }

  async deactivateEmployee(scope: StaffTenantScope, staffId: string): Promise<StaffRecord | null> {
    const existing = await prisma.staff.findFirst({
      where: { id: staffId, businessId: scope.businessId },
    });

    if (!existing) {
      return null;
    }

    await prisma.staff.update({
      where: { id: staffId },
      data: {
        isActive: false,
        employmentStatus: "TERMINATED",
        terminationDate: new Date(),
        accountStatus: "SUSPENDED",
      },
    });

    await prisma.staffAuditLog.create({
      data: {
        businessId: scope.businessId,
        staffId,
        eventType: "DEACTIVATED",
        actorUserId: scope.userId,
        actorStaffId: scope.actorStaffId,
      },
    });

    return this.buildRecord(scope, staffId);
  }

  async restoreEmployee(scope: StaffTenantScope, staffId: string): Promise<StaffRecord | null> {
    const existing = await prisma.staff.findFirst({
      where: { id: staffId, businessId: scope.businessId },
    });

    if (!existing) {
      return null;
    }

    await prisma.staff.update({
      where: { id: staffId },
      data: {
        isActive: true,
        employmentStatus: "ACTIVE",
        terminationDate: null,
        accountStatus: "ACTIVE",
      },
    });

    await prisma.staffAuditLog.create({
      data: {
        businessId: scope.businessId,
        staffId,
        eventType: "REACTIVATED",
        actorUserId: scope.userId,
        actorStaffId: scope.actorStaffId,
      },
    });

    return this.buildRecord(scope, staffId);
  }

  async bulkAction(scope: StaffTenantScope, input: StaffBulkActionSchemaInput): Promise<number> {
    let affected = 0;

    for (const staffId of input.staffIds) {
      if (input.action === "deactivate" || input.action === "delete") {
        const result = await this.deactivateEmployee(scope, staffId);
        if (result) affected += 1;
      } else if (input.action === "restore") {
        const result = await this.restoreEmployee(scope, staffId);
        if (result) affected += 1;
      }
    }

    return affected;
  }

  async assignRole(
    scope: StaffTenantScope,
    input: AssignRoleInput | AssignStaffRoleSchemaInput,
  ): Promise<StaffRecord | null> {
    const existing = await prisma.staff.findFirst({
      where: { id: input.staffId, businessId: scope.businessId },
    });

    if (!existing) {
      return null;
    }

    await prisma.staffRole.deleteMany({ where: { staffId: input.staffId } });
    await prisma.staffRole.create({
      data: { staffId: input.staffId, roleId: input.roleId },
    });

    await prisma.staffAuditLog.create({
      data: {
        businessId: scope.businessId,
        staffId: input.staffId,
        eventType: "ROLE_CHANGED",
        actorUserId: scope.userId,
        actorStaffId: scope.actorStaffId,
        metadata: { roleId: input.roleId, roleName: input.roleName },
      },
    });

    return this.buildRecord(scope, input.staffId);
  }

  async assignBranch(
    scope: StaffTenantScope,
    input: AssignStaffBranchSchemaInput,
  ): Promise<StaffRecord | null> {
    const existing = await prisma.staff.findFirst({
      where: { id: input.staffId, businessId: scope.businessId },
    });

    if (!existing) {
      return null;
    }

    if (input.isPrimary) {
      await prisma.staffBranchAssignment.updateMany({
        where: { staffId: input.staffId },
        data: { isPrimary: false },
      });
      await prisma.staff.update({
        where: { id: input.staffId },
        data: { branchId: input.branchId },
      });
    }

    await prisma.staffBranchAssignment.upsert({
      where: { staffId_branchId: { staffId: input.staffId, branchId: input.branchId } },
      create: {
        staffId: input.staffId,
        branchId: input.branchId,
        isPrimary: input.isPrimary,
      },
      update: { isPrimary: input.isPrimary },
    });

    await prisma.staffAuditLog.create({
      data: {
        businessId: scope.businessId,
        staffId: input.staffId,
        eventType: "BRANCH_CHANGED",
        actorUserId: scope.userId,
        actorStaffId: scope.actorStaffId,
        metadata: { branchId: input.branchId },
      },
    });

    return this.buildRecord(scope, input.staffId);
  }

  async scheduleShift(
    scope: StaffTenantScope,
    input: ScheduleShiftInput | ScheduleStaffShiftSchemaInput,
  ): Promise<StaffShift | null> {
    const existing = await prisma.staff.findFirst({
      where: { id: input.staffId, businessId: scope.businessId },
    });

    if (!existing) {
      return null;
    }

    const branchMeta = await this.loadBranchMeta(scope);
    const shift = createScheduledShift(scope, input);
    branchMeta.shifts = [...(branchMeta.shifts ?? []), shift];
    await this.saveBranchMeta(scope, branchMeta);
    return shift;
  }

  async clockIn(
    scope: StaffTenantScope,
    input: ClockStaffActionSchemaInput,
  ): Promise<StaffRecord | null> {
    const branchMeta = await this.loadBranchMeta(scope);
    const attendance = createAttendanceRecord(scope, {
      staffId: input.staffId,
      branchId: input.branchId,
      shiftId: input.shiftId ?? null,
      clockInAt: new Date().toISOString(),
    });
    branchMeta.attendance = [...(branchMeta.attendance ?? []), attendance];
    await this.saveBranchMeta(scope, branchMeta);
    return this.buildRecord(scope, input.staffId);
  }

  async clockOut(
    scope: StaffTenantScope,
    input: ClockStaffActionSchemaInput,
  ): Promise<StaffRecord | null> {
    const branchMeta = await this.loadBranchMeta(scope);
    const openEntry = [...(branchMeta.attendance ?? [])]
      .reverse()
      .find((entry) => entry.staffId === input.staffId && !entry.clockOutAt);

    if (!openEntry) {
      return null;
    }

    openEntry.clockOutAt = new Date().toISOString();
    openEntry.workedMinutes = Math.max(
      0,
      Math.round(
        (new Date(openEntry.clockOutAt).getTime() - new Date(openEntry.clockInAt!).getTime()) /
          60_000,
      ),
    );
    openEntry.overtimeMinutes = Math.max(0, openEntry.workedMinutes - openEntry.scheduledMinutes);
    await this.saveBranchMeta(scope, branchMeta);
    return this.buildRecord(scope, input.staffId);
  }

  async createLeaveRequest(
    scope: StaffTenantScope,
    input: CreateStaffLeaveSchemaInput,
  ): Promise<StaffRecord | null> {
    const branchMeta = await this.loadBranchMeta(scope);
    const leave = createLeaveRequest(scope, input);
    branchMeta.leaveRequests = [...(branchMeta.leaveRequests ?? []), leave];
    await this.saveBranchMeta(scope, branchMeta);
    return this.buildRecord(scope, input.staffId);
  }

  async approveLeave(
    scope: StaffTenantScope,
    input: ApproveLeaveInput | ApproveStaffLeaveSchemaInput,
  ): Promise<StaffRecord | null> {
    const branchMeta = await this.loadBranchMeta(scope);
    const leave = (branchMeta.leaveRequests ?? []).find(
      (entry) => entry.id === input.leaveRequestId,
    );

    if (!leave || leave.status !== LEAVE_STATUSES.PENDING) {
      return null;
    }

    leave.status = LEAVE_STATUSES.APPROVED;
    leave.approvedByStaffId = scope.actorStaffId ?? scope.userId;
    leave.approvedAt = new Date().toISOString();
    leave.updatedAt = leave.approvedAt;
    await this.saveBranchMeta(scope, branchMeta);

    await prisma.staff.update({
      where: { id: leave.staffId },
      data: { employmentStatus: "ON_LEAVE" },
    });

    return this.buildRecord(scope, leave.staffId);
  }

  async getPendingLeaveRequests(scope: StaffTenantScope): Promise<StaffRecord[]> {
    const records = await this.listRecords(scope);
    return records.filter((record) =>
      record.leaveRequests.some((leave) => leave.status === LEAVE_STATUSES.PENDING),
    );
  }

  async getUpcomingShifts(scope: StaffTenantScope, limit = 20): Promise<StaffShift[]> {
    const meta = await this.loadBranchMeta(scope);
    const today = new Date().toISOString().slice(0, 10);
    return (meta.shifts ?? [])
      .filter((shift) => shift.shiftDate >= today)
      .sort((a, b) => a.shiftDate.localeCompare(b.shiftDate))
      .slice(0, limit);
  }

  async getAttendanceIssues(scope: StaffTenantScope): Promise<StaffRecord[]> {
    const records = await this.listRecords(scope);
    return records.filter((record) =>
      record.attendance.some(
        (entry) =>
          entry.status === ATTENDANCE_STATUSES.LATE ||
          entry.status === ATTENDANCE_STATUSES.ABSENT,
      ),
    );
  }
}

export const staffRepository = new StaffRepository();

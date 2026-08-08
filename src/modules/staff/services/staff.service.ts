import { DOMAIN_EVENT_TYPES } from "@/modules/platform-orchestration/constants/domain-events";
import {
  moduleScopeFromPlatform,
  publishModuleDomainEvent,
} from "@/modules/platform-orchestration/lib/publish-module-event";
import { staffRepository, type StaffSearchResult } from "@/modules/staff/repository/staff-repository";
import {
  resolveStaffScope,
  toStaffPlatformContext,
  type StaffTenantScope,
} from "@/modules/staff/lib/staff-scope";
import type {
  ApproveLeaveInput,
  AssignRoleInput,
  CreateEmployeeInput,
  ScheduleShiftInput,
  StaffPlatformContext,
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

function resolveScope(context: StaffPlatformContext): StaffTenantScope {
  return {
    tenantId: context.tenantId,
    workspaceId: context.workspaceId,
    businessId: context.businessId,
    branchId: context.branchId,
    userId: context.userId,
    actorStaffId: null,
  };
}

/** Domain service for staff operations. */
export class StaffService {
  async list(context: StaffPlatformContext) {
    return staffRepository.listRecords(resolveScope(context));
  }

  async search(query: StaffSearchSchemaInput, context: StaffPlatformContext): Promise<StaffSearchResult>;
  async search(query: StaffSearchQuery, context: StaffPlatformContext): Promise<StaffSearchResult>;
  async search(
    query: StaffSearchQuery | StaffSearchSchemaInput,
    context: StaffPlatformContext,
  ): Promise<StaffSearchResult> {
    return staffRepository.search(resolveScope(context), query);
  }

  async getById(context: StaffPlatformContext, staffId: string): Promise<StaffRecord | null> {
    return staffRepository.findById(resolveScope(context), staffId);
  }

  async listDepartments(context: StaffPlatformContext) {
    return staffRepository.listDepartments(resolveScope(context));
  }

  async listDesignations(context: StaffPlatformContext) {
    return staffRepository.listDesignations(resolveScope(context));
  }

  async createEmployee(
    context: StaffPlatformContext,
    input: CreateEmployeeInput | CreateStaffEmployeeSchemaInput,
  ): Promise<StaffRecord> {
    const record = await staffRepository.createEmployee(resolveScope(context), {
      ...input,
      branchId: input.branchId ?? context.branchId,
    });
    await publishModuleDomainEvent(moduleScopeFromPlatform(context), {
      eventType: DOMAIN_EVENT_TYPES.STAFF_CREATED,
      aggregateId: record.member.id,
      payload: { staffId: record.member.id },
    });
    return record;
  }

  async updateEmployee(context: StaffPlatformContext, input: UpdateStaffEmployeeSchemaInput) {
    const record = await staffRepository.updateEmployee(resolveScope(context), input);
    if (record) {
      await publishModuleDomainEvent(moduleScopeFromPlatform(context), {
        eventType: DOMAIN_EVENT_TYPES.STAFF_UPDATED,
        aggregateId: record.member.id,
        payload: { staffId: record.member.id },
        idempotencyKey: `staff.updated:${record.member.id}:${Date.now()}`,
      });
    }
    return record;
  }

  async deactivateEmployee(context: StaffPlatformContext, staffId: string) {
    return staffRepository.deactivateEmployee(resolveScope(context), staffId);
  }

  async restoreEmployee(context: StaffPlatformContext, staffId: string) {
    return staffRepository.restoreEmployee(resolveScope(context), staffId);
  }

  async bulkAction(context: StaffPlatformContext, input: StaffBulkActionSchemaInput) {
    return staffRepository.bulkAction(resolveScope(context), input);
  }

  async assignRole(
    context: StaffPlatformContext,
    input: AssignRoleInput | AssignStaffRoleSchemaInput,
  ): Promise<StaffRecord | null> {
    return staffRepository.assignRole(resolveScope(context), input);
  }

  async assignBranch(context: StaffPlatformContext, input: AssignStaffBranchSchemaInput) {
    return staffRepository.assignBranch(resolveScope(context), input);
  }

  async scheduleShift(
    context: StaffPlatformContext,
    input: ScheduleShiftInput | ScheduleStaffShiftSchemaInput,
  ): Promise<StaffShift | null> {
    return staffRepository.scheduleShift(resolveScope(context), input);
  }

  async clockIn(context: StaffPlatformContext, input: ClockStaffActionSchemaInput) {
    const record = await staffRepository.clockIn(resolveScope(context), input);
    await publishModuleDomainEvent(moduleScopeFromPlatform(context), {
      eventType: DOMAIN_EVENT_TYPES.STAFF_CLOCKED_IN,
      aggregateId: input.staffId,
      payload: { staffId: input.staffId },
      idempotencyKey: `staff.clocked_in:${input.staffId}:${new Date().toISOString().slice(0, 10)}`,
    });
    return record;
  }

  async clockOut(context: StaffPlatformContext, input: ClockStaffActionSchemaInput) {
    const record = await staffRepository.clockOut(resolveScope(context), input);
    await publishModuleDomainEvent(moduleScopeFromPlatform(context), {
      eventType: DOMAIN_EVENT_TYPES.STAFF_CLOCKED_OUT,
      aggregateId: input.staffId,
      payload: { staffId: input.staffId },
      idempotencyKey: `staff.clocked_out:${input.staffId}:${new Date().toISOString().slice(0, 10)}`,
    });
    return record;
  }

  async createLeaveRequest(context: StaffPlatformContext, input: CreateStaffLeaveSchemaInput) {
    const record = await staffRepository.createLeaveRequest(resolveScope(context), input);
    await publishModuleDomainEvent(moduleScopeFromPlatform(context), {
      eventType: DOMAIN_EVENT_TYPES.STAFF_LEAVE_REQUESTED,
      aggregateId: input.staffId,
      payload: { staffId: input.staffId, leaveType: input.leaveType },
    });
    return record;
  }

  async approveLeave(
    context: StaffPlatformContext,
    input: ApproveLeaveInput | ApproveStaffLeaveSchemaInput,
  ): Promise<StaffRecord | null> {
    return staffRepository.approveLeave(resolveScope(context), input);
  }

  async getPendingLeave(context: StaffPlatformContext) {
    return staffRepository.getPendingLeaveRequests(resolveScope(context));
  }

  async getUpcomingShifts(context: StaffPlatformContext, limit?: number) {
    return staffRepository.getUpcomingShifts(resolveScope(context), limit);
  }

  async getAttendanceIssues(context: StaffPlatformContext) {
    return staffRepository.getAttendanceIssues(resolveScope(context));
  }
}

export const staffService = new StaffService();

export { resolveStaffScope, toStaffPlatformContext };

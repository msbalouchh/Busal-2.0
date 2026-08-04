import { staffRepository } from "@/modules/staff/repository/staff-repository";
import type {
  ApproveLeaveInput,
  AssignRoleInput,
  CreateEmployeeInput,
  ScheduleShiftInput,
  StaffRecord,
  StaffSearchQuery,
  StaffShift,
} from "@/modules/staff/types/staff-platform";

/** Domain service for staff operations. */
export class StaffService {
  list(): StaffRecord[] {
    return staffRepository.listRecords();
  }

  getById(staffId: string): StaffRecord | null {
    return staffRepository.findById(staffId) ?? null;
  }

  search(query: StaffSearchQuery = {}): StaffRecord[] {
    return staffRepository.search(query);
  }

  createEmployee(input: CreateEmployeeInput): StaffRecord {
    return staffRepository.createEmployee(input);
  }

  assignRole(input: AssignRoleInput): StaffRecord | null {
    return staffRepository.assignRole(input);
  }

  scheduleShift(input: ScheduleShiftInput): StaffShift | null {
    return staffRepository.scheduleShift(input);
  }

  approveLeave(input: ApproveLeaveInput): StaffRecord | null {
    return staffRepository.approveLeave(input);
  }

  getPendingLeave(): StaffRecord[] {
    return staffRepository.getPendingLeaveRequests();
  }

  getUpcomingShifts(limit?: number): StaffShift[] {
    return staffRepository.getUpcomingShifts(limit);
  }

  getAttendanceIssues(): StaffRecord[] {
    return staffRepository.getAttendanceIssues();
  }
}

export const staffService = new StaffService();

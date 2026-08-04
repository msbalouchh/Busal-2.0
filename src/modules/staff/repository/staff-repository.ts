import {
  EMPLOYMENT_STATUSES,
  LEAVE_STATUSES,
  STAFF_ACTIVITY_EVENT_TYPES,
  STAFF_SHIFT_STATUSES,
} from "@/modules/staff/constants/staff-status";
import {
  DEFAULT_STAFF_SCOPE,
  MOCK_DEPARTMENTS,
  MOCK_DESIGNATIONS,
  MOCK_STAFF_RECORDS,
} from "@/modules/staff/constants/mock-data";
import type {
  ApproveLeaveInput,
  AssignRoleInput,
  CreateEmployeeInput,
  ScheduleShiftInput,
  StaffRecord,
  StaffSearchQuery,
  StaffShift,
} from "@/modules/staff/types/staff-platform";

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function generateEmployeeNumber(): string {
  return `EMP-${String(Math.floor(Math.random() * 900) + 100)}`;
}

/** In-memory staff repository (mock only, no backend). */
export class StaffRepository {
  private records: StaffRecord[] = structuredClone(MOCK_STAFF_RECORDS);
  private departments = structuredClone(MOCK_DEPARTMENTS);
  private designations = structuredClone(MOCK_DESIGNATIONS);

  listRecords(): StaffRecord[] {
    return structuredClone(this.records);
  }

  listDepartments() {
    return structuredClone(this.departments);
  }

  listDesignations() {
    return structuredClone(this.designations);
  }

  findById(staffId: string): StaffRecord | undefined {
    return this.records.find((record) => record.member.id === staffId);
  }

  search(query: StaffSearchQuery = {}): StaffRecord[] {
    let results = this.listRecords();

    if (query.tenantId) {
      results = results.filter((r) => r.member.tenantId === query.tenantId);
    }

    if (query.businessId) {
      results = results.filter((r) => r.member.businessId === query.businessId);
    }

    if (query.branchId) {
      results = results.filter((r) =>
        r.branchAssignments.some((ba) => ba.branchId === query.branchId),
      );
    }

    if (query.departmentId) {
      results = results.filter((r) => r.profile.departmentId === query.departmentId);
    }

    if (query.employmentStatus) {
      results = results.filter((r) => r.member.employmentStatus === query.employmentStatus);
    }

    if (query.departmentType) {
      results = results.filter((r) => r.department.departmentType === query.departmentType);
    }

    if (query.roleId) {
      results = results.filter((r) => r.roleAssignments.some((ra) => ra.roleId === query.roleId));
    }

    if (query.isActive !== undefined) {
      results = results.filter((r) => r.member.isActive === query.isActive);
    }

    if (query.query) {
      const term = query.query.toLowerCase();
      results = results.filter(
        (r) =>
          r.member.displayName.toLowerCase().includes(term) ||
          r.member.email.toLowerCase().includes(term) ||
          r.member.employeeNumber.toLowerCase().includes(term) ||
          r.designation.title.toLowerCase().includes(term),
      );
    }

    if (query.limit) {
      results = results.slice(0, query.limit);
    }

    return results;
  }

  createEmployee(input: CreateEmployeeInput): StaffRecord {
    const now = new Date().toISOString();
    const staffId = createId("staff");
    const employeeNumber = generateEmployeeNumber();
    const department = this.departments.find((d) => d.id === input.departmentId)!;
    const designation = this.designations.find((d) => d.id === input.designationId)!;
    const displayName = `${input.firstName} ${input.lastName}`;

    const record: StaffRecord = {
      member: {
        id: staffId,
        tenantId: DEFAULT_STAFF_SCOPE.tenantId,
        workspaceId: DEFAULT_STAFF_SCOPE.workspaceId,
        businessId: DEFAULT_STAFF_SCOPE.businessId,
        userId: null,
        employeeNumber,
        firstName: input.firstName,
        lastName: input.lastName,
        displayName,
        email: input.email,
        phone: input.phone ?? null,
        avatarUrl: null,
        employmentStatus: EMPLOYMENT_STATUSES.ACTIVE,
        hireDate: input.hireDate,
        terminationDate: null,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      profile: {
        staffId,
        dateOfBirth: null,
        nationalId: null,
        address: null,
        city: null,
        postcode: null,
        country: "GB",
        departmentId: input.departmentId,
        designationId: input.designationId,
        managerStaffId: DEFAULT_STAFF_SCOPE.managerStaffId,
        bio: null,
        preferredLanguage: "en-GB",
        timezone: "Europe/London",
      },
      department,
      designation,
      branchAssignments: [
        {
          id: createId("ba"),
          staffId,
          branchId: input.branchId,
          branchName: "Main Branch",
          isPrimary: true,
          assignedAt: now,
          assignedByStaffId: DEFAULT_STAFF_SCOPE.managerStaffId,
        },
      ],
      roleAssignments: [],
      permissionAssignments: [],
      shifts: [],
      schedules: [],
      attendance: [],
      leaveRequests: [],
      payroll: {
        staffId,
        tenantId: DEFAULT_STAFF_SCOPE.tenantId,
        businessId: DEFAULT_STAFF_SCOPE.businessId,
        payFrequency: "monthly",
        hourlyRateCents: input.hourlyRateCents ?? null,
        salaryCents: input.salaryCents ?? null,
        currency: "GBP",
        taxCode: null,
        bankAccountLast4: null,
        isPayrollEnabled: true,
        effectiveFrom: input.hireDate,
      },
      performanceReviews: [],
      trainingRecords: [],
      certifications: [],
      emergencyContacts: [],
      documents: [],
      activityLog: [
        {
          id: createId("log"),
          staffId,
          tenantId: DEFAULT_STAFF_SCOPE.tenantId,
          businessId: DEFAULT_STAFF_SCOPE.businessId,
          eventType: STAFF_ACTIVITY_EVENT_TYPES.HIRED,
          actorStaffId: DEFAULT_STAFF_SCOPE.managerStaffId,
          message: `${displayName} hired`,
          metadata: { department: department.name },
          occurredAt: now,
        },
      ],
      analytics: {
        staffId,
        attendanceRateBps: 10000,
        punctualityRateBps: 10000,
        overtimeHoursMonth: 0,
        leaveDaysUsed: 0,
        leaveDaysRemaining: 28,
        avgPerformanceScoreBps: 0,
        trainingCompletionRateBps: 0,
        shiftCoverageRateBps: 10000,
      },
      aiContext: {
        staffId,
        summary: `${displayName} — ${designation.title}`,
        labourDemandScore: 0.5,
        staffingGapHours: 0,
        attendanceRiskScore: 0,
        performanceTrend: "stable",
        recommendedShiftHours: 40,
        insights: [],
        recommendedActions: ["Schedule onboarding training"],
        lastGeneratedAt: now,
      },
    };

    this.records.push(record);
    return structuredClone(record);
  }

  assignRole(input: AssignRoleInput): StaffRecord | null {
    const record = this.findById(input.staffId);

    if (!record) {
      return null;
    }

    const now = new Date().toISOString();

    record.roleAssignments.push({
      id: createId("ra"),
      staffId: input.staffId,
      roleId: input.roleId,
      roleName: input.roleName,
      scope: input.scope,
      scopeId: input.scopeId,
      assignedAt: now,
      assignedByStaffId: input.assignedByStaffId,
      expiresAt: null,
    });

    record.activityLog.push({
      id: createId("log"),
      staffId: input.staffId,
      tenantId: record.member.tenantId,
      businessId: record.member.businessId,
      eventType: STAFF_ACTIVITY_EVENT_TYPES.ROLE_ASSIGNED,
      actorStaffId: input.assignedByStaffId,
      message: `Role ${input.roleName} assigned`,
      metadata: { roleId: input.roleId },
      occurredAt: now,
    });

    return structuredClone(record);
  }

  scheduleShift(input: ScheduleShiftInput): StaffShift | null {
    const record = this.findById(input.staffId);

    if (!record) {
      return null;
    }

    const now = new Date().toISOString();
    const shift: StaffShift = {
      id: createId("shift"),
      tenantId: DEFAULT_STAFF_SCOPE.tenantId,
      businessId: DEFAULT_STAFF_SCOPE.businessId,
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

    record.shifts.push(shift);

    record.activityLog.push({
      id: createId("log"),
      staffId: input.staffId,
      tenantId: record.member.tenantId,
      businessId: record.member.businessId,
      eventType: STAFF_ACTIVITY_EVENT_TYPES.SHIFT_SCHEDULED,
      actorStaffId: DEFAULT_STAFF_SCOPE.managerStaffId,
      message: `Shift scheduled ${input.shiftDate} ${input.startTime}-${input.endTime}`,
      metadata: { shiftId: shift.id },
      occurredAt: now,
    });

    return structuredClone(shift);
  }

  approveLeave(input: ApproveLeaveInput): StaffRecord | null {
    const record = this.records.find((r) =>
      r.leaveRequests.some((lr) => lr.id === input.leaveRequestId),
    );

    if (!record) {
      return null;
    }

    const leave = record.leaveRequests.find((lr) => lr.id === input.leaveRequestId);

    if (!leave || leave.status !== LEAVE_STATUSES.PENDING) {
      return null;
    }

    const now = new Date().toISOString();
    leave.status = LEAVE_STATUSES.APPROVED;
    leave.approvedByStaffId = input.approvedByStaffId;
    leave.approvedAt = now;
    leave.updatedAt = now;

    record.activityLog.push({
      id: createId("log"),
      staffId: record.member.id,
      tenantId: record.member.tenantId,
      businessId: record.member.businessId,
      eventType: STAFF_ACTIVITY_EVENT_TYPES.LEAVE_APPROVED,
      actorStaffId: input.approvedByStaffId,
      message: `Leave approved ${leave.startDate} to ${leave.endDate}`,
      metadata: { leaveRequestId: input.leaveRequestId },
      occurredAt: now,
    });

    return structuredClone(record);
  }

  getPendingLeaveRequests(): StaffRecord[] {
    return this.records.filter((r) =>
      r.leaveRequests.some((lr) => lr.status === LEAVE_STATUSES.PENDING),
    );
  }

  getUpcomingShifts(limit = 20): StaffShift[] {
    const today = "2026-02-15";
    const shifts: StaffShift[] = [];

    for (const record of this.records) {
      shifts.push(...record.shifts.filter((s) => s.shiftDate >= today));
    }

    return shifts.sort((a, b) => a.shiftDate.localeCompare(b.shiftDate)).slice(0, limit);
  }

  getAttendanceIssues(): StaffRecord[] {
    return this.records.filter((r) =>
      r.attendance.some((a) => a.status === "late" || a.status === "absent"),
    );
  }
}

export const staffRepository = new StaffRepository();

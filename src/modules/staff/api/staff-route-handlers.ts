import "server-only";

import { NextResponse } from "next/server";

import { STAFF_MODULE_PERMISSIONS } from "@/modules/staff/constants/permissions";
import { resolveStaffScope, toStaffPlatformContext } from "@/modules/staff/lib/staff-scope";
import { staffService } from "@/modules/staff/services/staff.service";
import { buildStaffPlatformSnapshot } from "@/modules/staff/services/staff-platform.service";
import {
  approveStaffLeaveSchema,
  assignStaffBranchSchema,
  assignStaffRoleSchema,
  clockStaffActionSchema,
  createStaffEmployeeSchema,
  createStaffLeaveSchema,
  scheduleStaffShiftSchema,
  staffBulkActionSchema,
  staffSearchSchema,
  updateStaffEmployeeSchema,
} from "@/modules/staff/validation/staff-schemas";
import {
  handlePlatformRouteError,
  protectedRoute,
} from "@/modules/platform-guards/guards/route.guards";

function jsonSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export async function handleListStaffMembers(request: Request) {
  try {
    const platform = await protectedRoute({ permission: STAFF_MODULE_PERMISSIONS.STAFF_READ });
    const context = toStaffPlatformContext(resolveStaffScope(platform));
    const url = new URL(request.url);
    const parsed = staffSearchSchema.parse(Object.fromEntries(url.searchParams.entries()));
    const snapshot = url.searchParams.get("snapshot") === "true";

    const [result, platformSnapshot, departments, designations] = await Promise.all([
      staffService.search(parsed, context),
      snapshot ? buildStaffPlatformSnapshot(context) : Promise.resolve(null),
      snapshot ? staffService.listDepartments(context) : Promise.resolve([]),
      snapshot ? staffService.listDesignations(context) : Promise.resolve([]),
    ]);

    if (snapshot && platformSnapshot) {
      return jsonSuccess({
        ...platformSnapshot,
        context,
        departments,
        designations,
        records: result.records,
        pagination: {
          total: result.total,
          page: result.page,
          pageSize: result.pageSize,
          totalPages: result.totalPages,
        },
      });
    }

    return jsonSuccess(result);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleGetStaffMember(_request: Request, staffId: string) {
  try {
    const platform = await protectedRoute({ permission: STAFF_MODULE_PERMISSIONS.STAFF_READ });
    const context = toStaffPlatformContext(resolveStaffScope(platform));
    const record = await staffService.getById(context, staffId);

    if (!record) {
      return NextResponse.json({ success: false, error: "Staff member not found" }, { status: 404 });
    }

    return jsonSuccess(record);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleCreateStaffMember(request: Request) {
  try {
    const platform = await protectedRoute({ permission: STAFF_MODULE_PERMISSIONS.STAFF_CREATE });
    const context = toStaffPlatformContext(resolveStaffScope(platform));
    const body = createStaffEmployeeSchema.parse(await request.json());
    const record = await staffService.createEmployee(context, body);
    return jsonSuccess(record, 201);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleUpdateStaffMember(request: Request, staffId: string) {
  try {
    const platform = await protectedRoute({ permission: STAFF_MODULE_PERMISSIONS.STAFF_UPDATE });
    const context = toStaffPlatformContext(resolveStaffScope(platform));
    const body = updateStaffEmployeeSchema.parse({ ...(await request.json()), staffId });
    const record = await staffService.updateEmployee(context, body);

    if (!record) {
      return NextResponse.json({ success: false, error: "Staff member not found" }, { status: 404 });
    }

    return jsonSuccess(record);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleDeactivateStaffMember(_request: Request, staffId: string) {
  try {
    const platform = await protectedRoute({ permission: STAFF_MODULE_PERMISSIONS.STAFF_DELETE });
    const context = toStaffPlatformContext(resolveStaffScope(platform));
    const record = await staffService.deactivateEmployee(context, staffId);

    if (!record) {
      return NextResponse.json({ success: false, error: "Staff member not found" }, { status: 404 });
    }

    return jsonSuccess(record);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleRestoreStaffMember(_request: Request, staffId: string) {
  try {
    const platform = await protectedRoute({ permission: STAFF_MODULE_PERMISSIONS.STAFF_UPDATE });
    const context = toStaffPlatformContext(resolveStaffScope(platform));
    const record = await staffService.restoreEmployee(context, staffId);

    if (!record) {
      return NextResponse.json({ success: false, error: "Staff member not found" }, { status: 404 });
    }

    return jsonSuccess(record);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleBulkStaffAction(request: Request) {
  try {
    const platform = await protectedRoute({ permission: STAFF_MODULE_PERMISSIONS.STAFF_MANAGE });
    const context = toStaffPlatformContext(resolveStaffScope(platform));
    const body = staffBulkActionSchema.parse(await request.json());
    const affected = await staffService.bulkAction(context, body);
    return jsonSuccess({ affected });
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleAssignStaffRole(request: Request) {
  try {
    const platform = await protectedRoute({ permission: STAFF_MODULE_PERMISSIONS.STAFF_MANAGE });
    const scope = resolveStaffScope(platform);
    const context = toStaffPlatformContext(scope);
    const body = assignStaffRoleSchema.parse(await request.json());
    const record = await staffService.assignRole(context, {
      ...body,
      assignedByStaffId: scope.actorStaffId ?? context.userId,
    });
    return jsonSuccess(record);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleAssignStaffBranch(request: Request) {
  try {
    const platform = await protectedRoute({ permission: STAFF_MODULE_PERMISSIONS.STAFF_MANAGE });
    const context = toStaffPlatformContext(resolveStaffScope(platform));
    const body = assignStaffBranchSchema.parse(await request.json());
    const record = await staffService.assignBranch(context, body);
    return jsonSuccess(record);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleScheduleStaffShift(request: Request) {
  try {
    const platform = await protectedRoute({ permission: STAFF_MODULE_PERMISSIONS.STAFF_UPDATE });
    const context = toStaffPlatformContext(resolveStaffScope(platform));
    const body = scheduleStaffShiftSchema.parse(await request.json());
    const shift = await staffService.scheduleShift(context, body);
    return jsonSuccess(shift);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleClockInStaff(request: Request) {
  try {
    const platform = await protectedRoute({ permission: STAFF_MODULE_PERMISSIONS.STAFF_UPDATE });
    const context = toStaffPlatformContext(resolveStaffScope(platform));
    const body = clockStaffActionSchema.parse(await request.json());
    const record = await staffService.clockIn(context, body);
    return jsonSuccess(record);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleClockOutStaff(request: Request) {
  try {
    const platform = await protectedRoute({ permission: STAFF_MODULE_PERMISSIONS.STAFF_UPDATE });
    const context = toStaffPlatformContext(resolveStaffScope(platform));
    const body = clockStaffActionSchema.parse(await request.json());
    const record = await staffService.clockOut(context, body);
    return jsonSuccess(record);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleCreateStaffLeave(request: Request) {
  try {
    const platform = await protectedRoute({ permission: STAFF_MODULE_PERMISSIONS.STAFF_UPDATE });
    const context = toStaffPlatformContext(resolveStaffScope(platform));
    const body = createStaffLeaveSchema.parse(await request.json());
    const record = await staffService.createLeaveRequest(context, body);
    return jsonSuccess(record);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleApproveStaffLeave(request: Request) {
  try {
    const platform = await protectedRoute({ permission: STAFF_MODULE_PERMISSIONS.STAFF_MANAGE });
    const scope = resolveStaffScope(platform);
    const context = toStaffPlatformContext(scope);
    const body = approveStaffLeaveSchema.parse(await request.json());
    const record = await staffService.approveLeave(context, {
      ...body,
      approvedByStaffId: scope.actorStaffId ?? context.userId,
    });
    return jsonSuccess(record);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleStaffAlerts(_request: Request) {
  try {
    const platform = await protectedRoute({ permission: STAFF_MODULE_PERMISSIONS.STAFF_READ });
    const context = toStaffPlatformContext(resolveStaffScope(platform));
    const [pendingLeave, attendanceIssues, upcomingShifts] = await Promise.all([
      staffService.getPendingLeave(context),
      staffService.getAttendanceIssues(context),
      staffService.getUpcomingShifts(context, 10),
    ]);
    return jsonSuccess({ pendingLeave, attendanceIssues, upcomingShifts });
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

import "server-only";

import { NextResponse } from "next/server";

import {
  handlePlatformRouteError,
  protectedRoute,
} from "@/modules/platform-guards/guards/route.guards";
import { TABLE_PERMISSIONS } from "@/modules/table-management/constants/permissions";
import {
  resolveTableScope,
  toTablePlatformContext,
} from "@/modules/table-management/lib/table-scope";
import { tableManagementService } from "@/modules/table-management/services/table-management.service";
import {
  buildTablePlatformSnapshot,
} from "@/modules/table-management/services/table-platform.service";
import {
  assignTableSchema,
  bulkUpdateTablesSchema,
  createTableSchema,
  tableSearchSchema,
  updateTableSchema,
} from "@/modules/table-management/validation/table-schemas";

function jsonSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export async function handleListTables(request: Request) {
  try {
    const platform = await protectedRoute({ permission: TABLE_PERMISSIONS.TABLE_READ });
    const context = toTablePlatformContext(resolveTableScope(platform));
    const url = new URL(request.url);
    const parsed = tableSearchSchema.parse(Object.fromEntries(url.searchParams.entries()));
    const [result, snapshot] = await Promise.all([
      tableManagementService.searchTables(parsed, context),
      buildTablePlatformSnapshot(context),
    ]);

    return jsonSuccess({ ...result, snapshot });
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleCreateTable(request: Request) {
  try {
    const platform = await protectedRoute({ permission: TABLE_PERMISSIONS.TABLE_CREATE });
    const context = toTablePlatformContext(resolveTableScope(platform));
    const body = createTableSchema.parse(await request.json());
    const record = await tableManagementService.createTable(context, body);
    return jsonSuccess(record, 201);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleGetTable(_request: Request, tableId: string) {
  try {
    const platform = await protectedRoute({ permission: TABLE_PERMISSIONS.TABLE_READ });
    const context = toTablePlatformContext(resolveTableScope(platform));
    const record = await tableManagementService.getTableById(context, tableId);

    if (!record) {
      return NextResponse.json({ success: false, error: "Table not found" }, { status: 404 });
    }

    return jsonSuccess(record);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleUpdateTable(request: Request, tableId: string) {
  try {
    const platform = await protectedRoute({ permission: TABLE_PERMISSIONS.TABLE_UPDATE });
    const context = toTablePlatformContext(resolveTableScope(platform));
    const body = updateTableSchema.parse({ ...(await request.json()), tableId });
    const record = await tableManagementService.updateTable(context, body);

    if (!record) {
      return NextResponse.json({ success: false, error: "Table not found" }, { status: 404 });
    }

    return jsonSuccess(record);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleArchiveTable(_request: Request, tableId: string) {
  try {
    const platform = await protectedRoute({ permission: TABLE_PERMISSIONS.TABLE_DELETE });
    const context = toTablePlatformContext(resolveTableScope(platform));
    const record = await tableManagementService.archiveTable(context, tableId);

    if (!record) {
      return NextResponse.json({ success: false, error: "Table not found" }, { status: 404 });
    }

    return jsonSuccess(record);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleRestoreTable(_request: Request, tableId: string) {
  try {
    const platform = await protectedRoute({ permission: TABLE_PERMISSIONS.TABLE_UPDATE });
    const context = toTablePlatformContext(resolveTableScope(platform));
    const record = await tableManagementService.restoreTable(context, tableId);

    if (!record) {
      return NextResponse.json({ success: false, error: "Table not found" }, { status: 404 });
    }

    return jsonSuccess(record);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleBulkUpdateTables(request: Request) {
  try {
    const platform = await protectedRoute({ permission: TABLE_PERMISSIONS.TABLE_UPDATE });
    const context = toTablePlatformContext(resolveTableScope(platform));
    const body = bulkUpdateTablesSchema.parse(await request.json());
    const updatedCount = await tableManagementService.bulkUpdateStatus(
      context,
      body.tableIds,
      body.status,
    );
    return jsonSuccess({ updatedCount });
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleAssignTable(request: Request, tableId: string) {
  try {
    const platform = await protectedRoute({ permission: TABLE_PERMISSIONS.TABLE_MANAGE });
    const context = toTablePlatformContext(resolveTableScope(platform));
    const body = assignTableSchema.parse({ ...(await request.json()), tableId });
    const record = await tableManagementService.assignTable(context, {
      tableId: body.tableId,
      reservationId: body.reservationId,
      partySize: body.partySize,
      guestName: body.guestName,
      actorId: body.staffId ?? platform.user.id,
    });

    if (!record) {
      return NextResponse.json({ success: false, error: "Table not found" }, { status: 404 });
    }

    return jsonSuccess(record);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleListFloors() {
  try {
    const platform = await protectedRoute({ permission: TABLE_PERMISSIONS.TABLE_READ });
    const context = toTablePlatformContext(resolveTableScope(platform));
    const floors = await tableManagementService.listFloors(context);
    return jsonSuccess(floors);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

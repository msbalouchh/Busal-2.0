import "server-only";

import { NextResponse } from "next/server";

import {
  handlePlatformRouteError,
  protectedRoute,
} from "@/modules/platform-guards/guards/route.guards";
import { KITCHEN_MODULE_PERMISSIONS } from "@/modules/kitchen/constants/permissions";
import {
  resolveKitchenScope,
  toKitchenPlatformContext,
} from "@/modules/kitchen/lib/kitchen-scope";
import { kitchenService } from "@/modules/kitchen/services/kitchen.service";
import { buildKitchenPlatformSnapshot } from "@/modules/kitchen/services/kitchen-platform.service";
import {
  addKitchenNoteSchema,
  assignKitchenStationSchema,
  createKitchenStationSchema,
  kitchenOrderActionSchema,
  kitchenSearchSchema,
  receiveOmsOrderSchema,
  updateKitchenStationSchema,
} from "@/modules/kitchen/validation/kitchen-schemas";

function jsonSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export async function handleListKitchenOrders(request: Request) {
  try {
    const platform = await protectedRoute({ permission: KITCHEN_MODULE_PERMISSIONS.KITCHEN_READ });
    const context = toKitchenPlatformContext(resolveKitchenScope(platform));
    const url = new URL(request.url);
    const parsed = kitchenSearchSchema.parse(Object.fromEntries(url.searchParams.entries()));
    const [result, snapshot] = await Promise.all([
      kitchenService.search(parsed, context),
      buildKitchenPlatformSnapshot(context),
    ]);

    return jsonSuccess({ ...result, snapshot });
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleGetKitchenOrder(_request: Request, kitchenOrderId: string) {
  try {
    const platform = await protectedRoute({ permission: KITCHEN_MODULE_PERMISSIONS.KITCHEN_READ });
    const context = toKitchenPlatformContext(resolveKitchenScope(platform));
    const record = await kitchenService.getById(context, kitchenOrderId);

    if (!record) {
      return NextResponse.json({ success: false, error: "Kitchen order not found" }, { status: 404 });
    }

    return jsonSuccess(record);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleAcceptKitchenOrder(_request: Request, kitchenOrderId: string) {
  try {
    const platform = await protectedRoute({ permission: KITCHEN_MODULE_PERMISSIONS.KITCHEN_UPDATE });
    const context = toKitchenPlatformContext(resolveKitchenScope(platform));
    const record = await kitchenService.acceptOrder(context, { kitchenOrderId });
    return jsonSuccess(record);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleFireKitchenOrder(_request: Request, kitchenOrderId: string) {
  try {
    const platform = await protectedRoute({ permission: KITCHEN_MODULE_PERMISSIONS.KITCHEN_UPDATE });
    const context = toKitchenPlatformContext(resolveKitchenScope(platform));
    const record = await kitchenService.fireOrder(context, kitchenOrderId);
    return jsonSuccess(record);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleHoldKitchenOrder(_request: Request, kitchenOrderId: string) {
  try {
    const platform = await protectedRoute({ permission: KITCHEN_MODULE_PERMISSIONS.KITCHEN_UPDATE });
    const context = toKitchenPlatformContext(resolveKitchenScope(platform));
    const record = await kitchenService.holdOrder(context, kitchenOrderId);
    return jsonSuccess(record);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleResumeKitchenOrder(_request: Request, kitchenOrderId: string) {
  try {
    const platform = await protectedRoute({ permission: KITCHEN_MODULE_PERMISSIONS.KITCHEN_UPDATE });
    const context = toKitchenPlatformContext(resolveKitchenScope(platform));
    const record = await kitchenService.resumeOrder(context, kitchenOrderId);
    return jsonSuccess(record);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleReadyKitchenOrder(_request: Request, kitchenOrderId: string) {
  try {
    const platform = await protectedRoute({ permission: KITCHEN_MODULE_PERMISSIONS.KITCHEN_UPDATE });
    const context = toKitchenPlatformContext(resolveKitchenScope(platform));
    const record = await kitchenService.markReady(context, kitchenOrderId);
    return jsonSuccess(record);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleBumpKitchenOrder(_request: Request, kitchenOrderId: string) {
  try {
    const platform = await protectedRoute({ permission: KITCHEN_MODULE_PERMISSIONS.KITCHEN_UPDATE });
    const context = toKitchenPlatformContext(resolveKitchenScope(platform));
    const record = await kitchenService.bumpOrder(context, { kitchenOrderId });
    return jsonSuccess(record);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleRecallKitchenOrder(request: Request, kitchenOrderId: string) {
  try {
    const platform = await protectedRoute({ permission: KITCHEN_MODULE_PERMISSIONS.KITCHEN_MANAGE });
    const context = toKitchenPlatformContext(resolveKitchenScope(platform));
    const body = kitchenOrderActionSchema.parse({ ...(await request.json()), kitchenOrderId });
    const record = await kitchenService.recallOrder(context, body);
    return jsonSuccess(record);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleCompleteKitchenOrder(_request: Request, kitchenOrderId: string) {
  try {
    const platform = await protectedRoute({ permission: KITCHEN_MODULE_PERMISSIONS.KITCHEN_UPDATE });
    const context = toKitchenPlatformContext(resolveKitchenScope(platform));
    const record = await kitchenService.completeOrder(context, kitchenOrderId);
    return jsonSuccess(record);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleAssignKitchenStation(request: Request) {
  try {
    const platform = await protectedRoute({
      permission: KITCHEN_MODULE_PERMISSIONS.KITCHEN_ASSIGN_STATION,
    });
    const context = toKitchenPlatformContext(resolveKitchenScope(platform));
    const body = assignKitchenStationSchema.parse(await request.json());
    const record = await kitchenService.assignStation(context, body);
    return jsonSuccess(record);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleAddKitchenNote(request: Request) {
  try {
    const platform = await protectedRoute({ permission: KITCHEN_MODULE_PERMISSIONS.KITCHEN_UPDATE });
    const context = toKitchenPlatformContext(resolveKitchenScope(platform));
    const body = addKitchenNoteSchema.parse(await request.json());
    const record = await kitchenService.addNote(context, body);
    return jsonSuccess(record);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleReceiveOmsOrder(request: Request) {
  try {
    const platform = await protectedRoute({ permission: KITCHEN_MODULE_PERMISSIONS.KITCHEN_UPDATE });
    const context = toKitchenPlatformContext(resolveKitchenScope(platform));
    const body = receiveOmsOrderSchema.parse(await request.json());
    const record = await kitchenService.receiveFromOms(
      context,
      body.restaurantOrderId,
      body.priority,
    );
    return jsonSuccess(record, 201);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleListKitchenStations() {
  try {
    const platform = await protectedRoute({ permission: KITCHEN_MODULE_PERMISSIONS.KITCHEN_READ });
    const context = toKitchenPlatformContext(resolveKitchenScope(platform));
    const stations = await kitchenService.listStations(context);
    return jsonSuccess(stations);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleCreateKitchenStation(request: Request) {
  try {
    const platform = await protectedRoute({ permission: KITCHEN_MODULE_PERMISSIONS.KITCHEN_MANAGE });
    const context = toKitchenPlatformContext(resolveKitchenScope(platform));
    const body = createKitchenStationSchema.parse(await request.json());
    const station = await kitchenService.createStation(context, body);
    return jsonSuccess(station, 201);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleUpdateKitchenStation(request: Request, stationId: string) {
  try {
    const platform = await protectedRoute({ permission: KITCHEN_MODULE_PERMISSIONS.KITCHEN_MANAGE });
    const context = toKitchenPlatformContext(resolveKitchenScope(platform));
    const body = updateKitchenStationSchema.parse({ ...(await request.json()), stationId });
    const station = await kitchenService.updateStation(context, body);
    return jsonSuccess(station);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleArchiveKitchenStation(_request: Request, stationId: string) {
  try {
    const platform = await protectedRoute({ permission: KITCHEN_MODULE_PERMISSIONS.KITCHEN_MANAGE });
    const context = toKitchenPlatformContext(resolveKitchenScope(platform));
    const archived = await kitchenService.archiveStation(context, stationId);
    return jsonSuccess({ archived });
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleListKitchenQueues() {
  try {
    const platform = await protectedRoute({ permission: KITCHEN_MODULE_PERMISSIONS.KITCHEN_READ });
    const context = toKitchenPlatformContext(resolveKitchenScope(platform));
    const queues = await kitchenService.listQueues(context);
    return jsonSuccess(queues);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleGetKitchenQueue(_request: Request, queueId: string) {
  try {
    const platform = await protectedRoute({ permission: KITCHEN_MODULE_PERMISSIONS.KITCHEN_READ });
    const context = toKitchenPlatformContext(resolveKitchenScope(platform));
    const records = await kitchenService.getQueueRecords(context, queueId);
    return jsonSuccess(records);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleListKitchenScreens() {
  try {
    const platform = await protectedRoute({ permission: KITCHEN_MODULE_PERMISSIONS.KITCHEN_READ });
    const context = toKitchenPlatformContext(resolveKitchenScope(platform));
    const screens = await kitchenService.listScreens(context);
    return jsonSuccess(screens);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleKitchenSnapshot() {
  try {
    const platform = await protectedRoute({ permission: KITCHEN_MODULE_PERMISSIONS.KITCHEN_READ });
    const context = toKitchenPlatformContext(resolveKitchenScope(platform));
    const snapshot = await buildKitchenPlatformSnapshot(context);
    return jsonSuccess(snapshot);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

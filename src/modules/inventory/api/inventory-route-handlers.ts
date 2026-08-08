import "server-only";

import { NextResponse } from "next/server";

import { INVENTORY_MODULE_PERMISSIONS } from "@/modules/inventory/constants/permissions";
import { resolveInventoryScope, toInventoryPlatformContext } from "@/modules/inventory/lib/inventory-scope";
import { inventoryService } from "@/modules/inventory/services/inventory.service";
import { buildInventoryPlatformSnapshot } from "@/modules/inventory/services/inventory-platform.service";
import {
  createInventoryItemSchema,
  createInventoryPurchaseOrderSchema,
  createInventoryTransferSchema,
  inventoryBulkActionSchema,
  inventoryItemActionSchema,
  inventorySearchSchema,
  receiveInventoryGoodsSchema,
  recordInventoryWasteSchema,
  updateInventoryItemSchema,
  updateInventoryStockSchema,
} from "@/modules/inventory/validation/inventory-schemas";
import {
  handlePlatformRouteError,
  protectedRoute,
} from "@/modules/platform-guards/guards/route.guards";

function jsonSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export async function handleListInventoryItems(request: Request) {
  try {
    const platform = await protectedRoute({
      permission: INVENTORY_MODULE_PERMISSIONS.INVENTORY_READ,
    });
    const context = toInventoryPlatformContext(resolveInventoryScope(platform));
    const url = new URL(request.url);
    const parsed = inventorySearchSchema.parse(Object.fromEntries(url.searchParams.entries()));
    const snapshot = url.searchParams.get("snapshot") === "true";

    const [result, platformSnapshot, categories, locations, suppliers, purchaseOrders, recipeMappings] =
      await Promise.all([
        inventoryService.search(parsed, context),
        snapshot ? buildInventoryPlatformSnapshot(context) : Promise.resolve(null),
        snapshot ? inventoryService.listCategories(context) : Promise.resolve([]),
        snapshot ? inventoryService.listLocations(context) : Promise.resolve([]),
        snapshot ? inventoryService.listSuppliers(context) : Promise.resolve([]),
        snapshot ? inventoryService.listPurchaseOrders(context) : Promise.resolve([]),
        snapshot ? inventoryService.listRecipeMappings(context) : Promise.resolve([]),
      ]);

    if (snapshot && platformSnapshot) {
      return jsonSuccess({
        ...platformSnapshot,
        context,
        categories,
        locations,
        suppliers,
        purchaseOrders,
        recipeMappings,
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

export async function handleGetInventoryItem(_request: Request, itemId: string) {
  try {
    const platform = await protectedRoute({
      permission: INVENTORY_MODULE_PERMISSIONS.INVENTORY_READ,
    });
    const context = toInventoryPlatformContext(resolveInventoryScope(platform));
    const record = await inventoryService.getById(context, itemId);

    if (!record) {
      return NextResponse.json({ success: false, error: "Inventory item not found" }, { status: 404 });
    }

    return jsonSuccess(record);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleCreateInventoryItem(request: Request) {
  try {
    const platform = await protectedRoute({
      permission: INVENTORY_MODULE_PERMISSIONS.INVENTORY_CREATE,
    });
    const context = toInventoryPlatformContext(resolveInventoryScope(platform));
    const body = createInventoryItemSchema.parse(await request.json());
    const record = await inventoryService.createItem(context, body);
    return jsonSuccess(record, 201);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleUpdateInventoryItem(request: Request, itemId: string) {
  try {
    const platform = await protectedRoute({
      permission: INVENTORY_MODULE_PERMISSIONS.INVENTORY_UPDATE,
    });
    const context = toInventoryPlatformContext(resolveInventoryScope(platform));
    const body = updateInventoryItemSchema.parse({ ...(await request.json()), itemId });
    const record = await inventoryService.updateItem(context, body);

    if (!record) {
      return NextResponse.json({ success: false, error: "Inventory item not found" }, { status: 404 });
    }

    return jsonSuccess(record);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleArchiveInventoryItem(_request: Request, itemId: string) {
  try {
    const platform = await protectedRoute({
      permission: INVENTORY_MODULE_PERMISSIONS.INVENTORY_DELETE,
    });
    const context = toInventoryPlatformContext(resolveInventoryScope(platform));
    const record = await inventoryService.archiveItem(context, itemId);

    if (!record) {
      return NextResponse.json({ success: false, error: "Inventory item not found" }, { status: 404 });
    }

    return jsonSuccess(record);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleRestoreInventoryItem(_request: Request, itemId: string) {
  try {
    const platform = await protectedRoute({
      permission: INVENTORY_MODULE_PERMISSIONS.INVENTORY_UPDATE,
    });
    const context = toInventoryPlatformContext(resolveInventoryScope(platform));
    const record = await inventoryService.restoreItem(context, itemId);

    if (!record) {
      return NextResponse.json({ success: false, error: "Inventory item not found" }, { status: 404 });
    }

    return jsonSuccess(record);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleBulkInventoryAction(request: Request) {
  try {
    const platform = await protectedRoute({
      permission: INVENTORY_MODULE_PERMISSIONS.INVENTORY_UPDATE,
    });
    const context = toInventoryPlatformContext(resolveInventoryScope(platform));
    const body = inventoryBulkActionSchema.parse(await request.json());
    const affected = await inventoryService.bulkAction(context, body);
    return jsonSuccess({ affected });
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleUpdateInventoryStock(request: Request) {
  try {
    const platform = await protectedRoute({
      permission: INVENTORY_MODULE_PERMISSIONS.INVENTORY_UPDATE,
    });
    const context = toInventoryPlatformContext(resolveInventoryScope(platform));
    const body = updateInventoryStockSchema.parse(await request.json());
    const record = await inventoryService.updateStock(context, body);

    if (!record) {
      return NextResponse.json({ success: false, error: "Inventory item not found" }, { status: 404 });
    }

    return jsonSuccess(record);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleRecordInventoryWaste(request: Request) {
  try {
    const platform = await protectedRoute({
      permission: INVENTORY_MODULE_PERMISSIONS.INVENTORY_UPDATE,
    });
    const context = toInventoryPlatformContext(resolveInventoryScope(platform));
    const body = recordInventoryWasteSchema.parse(await request.json());
    const record = await inventoryService.recordWaste(context, body);

    if (!record) {
      return NextResponse.json({ success: false, error: "Inventory item not found" }, { status: 404 });
    }

    return jsonSuccess(record);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleCreateInventoryPurchaseOrder(request: Request) {
  try {
    const platform = await protectedRoute({
      permission: INVENTORY_MODULE_PERMISSIONS.INVENTORY_CREATE,
    });
    const context = toInventoryPlatformContext(resolveInventoryScope(platform));
    const body = createInventoryPurchaseOrderSchema.parse(await request.json());
    const purchaseOrder = await inventoryService.createPurchaseOrder(context, body);
    return jsonSuccess(purchaseOrder, 201);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleReceiveInventoryGoods(request: Request) {
  try {
    const platform = await protectedRoute({
      permission: INVENTORY_MODULE_PERMISSIONS.INVENTORY_UPDATE,
    });
    const context = toInventoryPlatformContext(resolveInventoryScope(platform));
    const body = receiveInventoryGoodsSchema.parse(await request.json());
    const purchaseOrder = await inventoryService.receiveGoods(context, body);
    return jsonSuccess(purchaseOrder);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleCreateInventoryTransfer(request: Request) {
  try {
    const platform = await protectedRoute({
      permission: INVENTORY_MODULE_PERMISSIONS.INVENTORY_UPDATE,
    });
    const context = toInventoryPlatformContext(resolveInventoryScope(platform));
    const body = createInventoryTransferSchema.parse(await request.json());
    const record = await inventoryService.createTransfer(context, body);

    if (!record) {
      return NextResponse.json({ success: false, error: "Inventory item not found" }, { status: 404 });
    }

    return jsonSuccess(record);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleInventoryLowStock(_request: Request) {
  try {
    const platform = await protectedRoute({
      permission: INVENTORY_MODULE_PERMISSIONS.INVENTORY_READ,
    });
    const context = toInventoryPlatformContext(resolveInventoryScope(platform));
    const records = await inventoryService.getLowStockItems(context);
    return jsonSuccess(records);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleInventoryExpiring(request: Request) {
  try {
    const platform = await protectedRoute({
      permission: INVENTORY_MODULE_PERMISSIONS.INVENTORY_READ,
    });
    const context = toInventoryPlatformContext(resolveInventoryScope(platform));
    const url = new URL(request.url);
    const withinDays = Number(url.searchParams.get("withinDays") ?? 3);
    const records = await inventoryService.getExpiringItems(context, withinDays);
    return jsonSuccess(records);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

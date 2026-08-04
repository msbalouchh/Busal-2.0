import "server-only";

import { NextResponse } from "next/server";

import {
  handlePlatformRouteError,
  protectedRoute,
} from "@/modules/platform-guards/guards/route.guards";
import { MENU_PERMISSIONS } from "@/modules/menu/constants/permissions";
import { resolveMenuScope, toMenuPlatformContext } from "@/modules/menu/lib/menu-scope";
import { menuRepository } from "@/modules/menu/repository/menu-repository";
import { menuService } from "@/modules/menu/services/menu.service";
import {
  bulkDeleteMenuItemsSchema,
  bulkUpdateMenuItemsSchema,
  createMenuItemSchema,
  menuSearchSchema,
  updateMenuItemSchema,
} from "@/modules/menu/validation/menu-schemas";

function jsonSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export async function handleListMenuItems(request: Request) {
  try {
    const platform = await protectedRoute({ permission: MENU_PERMISSIONS.MENU_READ });
    const scope = resolveMenuScope(platform);
    const context = toMenuPlatformContext(scope);
    const url = new URL(request.url);
    const parsed = menuSearchSchema.parse(Object.fromEntries(url.searchParams.entries()));
    const [result, menus] = await Promise.all([
      menuService.searchItems(parsed, context),
      menuRepository.listMenus(scope),
    ]);

    return jsonSuccess({ ...result, menus });
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleCreateMenuItem(request: Request) {
  try {
    const platform = await protectedRoute({ permission: MENU_PERMISSIONS.MENU_CREATE });
    const context = toMenuPlatformContext(resolveMenuScope(platform));
    const body = createMenuItemSchema.parse(await request.json());
    const record = await menuService.createItem(body, context);
    return jsonSuccess(record, 201);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleGetMenuItem(_request: Request, itemId: string) {
  try {
    const platform = await protectedRoute({ permission: MENU_PERMISSIONS.MENU_READ });
    const context = toMenuPlatformContext(resolveMenuScope(platform));
    const record = await menuService.getItemById(itemId, context);

    if (!record) {
      return NextResponse.json({ success: false, error: "Item not found" }, { status: 404 });
    }

    return jsonSuccess(record);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleUpdateMenuItem(request: Request, itemId: string) {
  try {
    const platform = await protectedRoute({ permission: MENU_PERMISSIONS.MENU_UPDATE });
    const context = toMenuPlatformContext(resolveMenuScope(platform));
    const body = updateMenuItemSchema.parse({ ...(await request.json()), itemId });
    const record = await menuService.updateItem(body, context);

    if (!record) {
      return NextResponse.json({ success: false, error: "Item not found" }, { status: 404 });
    }

    return jsonSuccess(record);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleDeleteMenuItem(_request: Request, itemId: string) {
  try {
    const platform = await protectedRoute({ permission: MENU_PERMISSIONS.MENU_DELETE });
    const context = toMenuPlatformContext(resolveMenuScope(platform));
    const deleted = await menuService.archiveItem(itemId, context);

    if (!deleted) {
      return NextResponse.json({ success: false, error: "Item not found" }, { status: 404 });
    }

    return jsonSuccess({ deleted: true });
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleBulkUpdateMenuItems(request: Request) {
  try {
    const platform = await protectedRoute({ permission: MENU_PERMISSIONS.MENU_UPDATE });
    const scope = resolveMenuScope(platform);
    const body = bulkUpdateMenuItemsSchema.parse(await request.json());
    const count = await menuRepository.bulkUpdateItems(scope, body.itemIds, {
      ...(body.status
        ? {
            status:
              body.status === "active"
                ? "ACTIVE"
                : body.status === "archived"
                  ? "ARCHIVED"
                  : "INACTIVE",
          }
        : {}),
      ...(body.isFeatured !== undefined ? { isFeatured: body.isFeatured } : {}),
    });

    return jsonSuccess({ updated: count });
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleBulkDeleteMenuItems(request: Request) {
  try {
    const platform = await protectedRoute({ permission: MENU_PERMISSIONS.MENU_DELETE });
    const scope = resolveMenuScope(platform);
    const body = bulkDeleteMenuItemsSchema.parse(await request.json());
    const count = await menuRepository.bulkArchiveItems(scope, body.itemIds);
    return jsonSuccess({ deleted: count });
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleMenuItemAiInsights(_request: Request, itemId: string) {
  try {
    const platform = await protectedRoute({ permission: MENU_PERMISSIONS.MENU_READ });
    const context = toMenuPlatformContext(resolveMenuScope(platform));
    const { buildMenuItemAiContext } = await import("@/modules/menu/services/menu-ai.service");
    const insights = await buildMenuItemAiContext(itemId, context);

    if (!insights) {
      return NextResponse.json({ success: false, error: "Item not found" }, { status: 404 });
    }

    return jsonSuccess(insights);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

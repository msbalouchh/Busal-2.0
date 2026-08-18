import "server-only";

import { NextResponse } from "next/server";

import { buildMenuScopeFromInput, toMenuPlatformContext } from "@/modules/menu/lib/menu-scope";
import { menuRepository } from "@/modules/menu/repository/menu-repository";
import { menuService } from "@/modules/menu/services/menu.service";
import { menuSearchSchema } from "@/modules/menu/validation/menu-schemas";
import { jsonSuccess, withPlatformApiAuth } from "@/modules/platform/api/v1/platform-api-handler";
import { PLATFORM_API_SCOPES } from "@/modules/platform/constants/api-scopes";

export async function handleV1ListMenuItems(request: Request) {
  return withPlatformApiAuth(request, [PLATFORM_API_SCOPES.MENU_READ], async (auth) => {
    const scope = buildMenuScopeFromInput({ businessId: auth.businessId });
    const context = toMenuPlatformContext(scope);
    const url = new URL(request.url);
    const parsed = menuSearchSchema.parse(Object.fromEntries(url.searchParams.entries()));
    const [result, menus] = await Promise.all([
      menuService.searchItems(parsed, context),
      menuRepository.listMenus(scope),
    ]);
    return jsonSuccess({ ...result, menus });
  });
}

export async function handleV1GetMenuItem(request: Request, itemId: string) {
  return withPlatformApiAuth(request, [PLATFORM_API_SCOPES.MENU_READ], async (auth) => {
    const scope = buildMenuScopeFromInput({ businessId: auth.businessId });
    const context = toMenuPlatformContext(scope);
    const record = await menuService.getItemById(itemId, context);

    if (!record) {
      return NextResponse.json({ success: false, error: "Menu item not found" }, { status: 404 });
    }

    return jsonSuccess(record);
  });
}

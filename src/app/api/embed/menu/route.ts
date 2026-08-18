import "server-only";

import { NextResponse } from "next/server";

import { buildMenuScopeFromInput, toMenuPlatformContext } from "@/modules/menu/lib/menu-scope";
import { menuService } from "@/modules/menu/services/menu.service";
import { menuSearchSchema } from "@/modules/menu/validation/menu-schemas";
import { verifyEmbedToken } from "@/modules/platform/services/platform-embed.service";
import { loadPlatformConsumptionConfig } from "@/modules/platform/lib/platform-settings";
import { resolvePlatformEntitlements } from "@/modules/platform/services/platform-entitlements.service";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get("token") ?? "";
    const payload = verifyEmbedToken(token);

    if (!payload || payload.widgetType !== "menu") {
      return NextResponse.json({ success: false, error: "Invalid embed token" }, { status: 401 });
    }

    const tenant = await prisma.tenantRecord.findUnique({
      where: { businessId: payload.businessId },
      select: { subscriptionPlan: true },
    });

    if (!resolvePlatformEntitlements(tenant?.subscriptionPlan).embed) {
      return NextResponse.json({ success: false, error: "Embed not enabled for plan" }, { status: 403 });
    }

    const config = await loadPlatformConsumptionConfig(payload.businessId);
    if (!config.embed.enabled) {
      return NextResponse.json({ success: false, error: "Embeds disabled" }, { status: 403 });
    }

    const referer = request.headers.get("referer") ?? "";
    if (payload.origin && referer && !referer.includes(new URL(payload.origin).host)) {
      return NextResponse.json({ success: false, error: "Origin not allowed" }, { status: 403 });
    }

    const scope = buildMenuScopeFromInput({ businessId: payload.businessId });
    const context = toMenuPlatformContext(scope);
    const result = await menuService.searchItems(menuSearchSchema.parse({ page: 1, pageSize: 50 }), context);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to load menu" },
      { status: 500 },
    );
  }
}

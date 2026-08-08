import { NextResponse } from "next/server";

import { tenantFoundationService } from "@/modules/tenant/services/tenant-foundation.service";
import {
  handlePlatformRouteError,
  protectedRoute,
} from "@/modules/platform-guards/guards/route.guards";

interface RouteContext {
  params: Promise<{ workspaceId: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const platform = await protectedRoute();
    const { workspaceId } = await context.params;

    const businessId = workspaceId.replace(/-ws$/, "");
    const snapshot = await tenantFoundationService.buildSnapshotForBusiness(
      businessId,
      platform.branchId ?? undefined,
    );

    return NextResponse.json({ success: true, data: snapshot.workspace });
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function PATCH(_request: Request, context: RouteContext) {
  try {
    const platform = await protectedRoute();
    const { workspaceId } = await context.params;
    const businessId = workspaceId.replace(/-ws$/, "");

    await tenantFoundationService.activateTenant(businessId, platform.user.id);
    const snapshot = await tenantFoundationService.buildSnapshotForBusiness(businessId);

    return NextResponse.json({ success: true, data: snapshot.workspace });
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

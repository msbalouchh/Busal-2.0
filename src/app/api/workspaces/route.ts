import { NextResponse } from "next/server";

import { tenantFoundationService } from "@/modules/tenant/services/tenant-foundation.service";
import {
  handlePlatformRouteError,
  protectedRoute,
} from "@/modules/platform-guards/guards/route.guards";

export async function GET() {
  try {
    const platform = await protectedRoute();
    const snapshot = await tenantFoundationService.buildSnapshotForBusiness(
      platform.business.id,
      platform.branchId ?? undefined,
    );

    return NextResponse.json({
      success: true,
      data: snapshot.workspaces,
    });
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

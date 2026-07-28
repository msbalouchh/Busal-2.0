import { NextResponse } from "next/server";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import {
  handlePlatformRouteError,
  protectedRoute,
} from "@/modules/platform-guards/guards/route.guards";
import { getTenantApiPayload } from "@/services/tenant-platform.service";

export async function GET() {
  try {
    const platform = await protectedRoute({
      permission: PERMISSION_CODES.TENANT_PLATFORM_VIEW,
    });

    const payload = await getTenantApiPayload(platform.business.id);

    return NextResponse.json({ success: true, data: payload });
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

import { NextResponse } from "next/server";

import { listCatalogPlans } from "@/modules/commercial-foundation/lib/plan-catalog";
import { handlePlatformRouteError, protectedRoute } from "@/modules/platform-guards/guards/route.guards";

export async function GET() {
  try {
    await protectedRoute();
    return NextResponse.json({ success: true, data: listCatalogPlans() });
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

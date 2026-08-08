import "server-only";

import { NextResponse } from "next/server";

import { getDashboardContext } from "@/modules/dashboard/lib/get-dashboard-context";
import { getTenantFoundationData } from "@/modules/tenant/lib/get-tenant-foundation-data";

export async function GET() {
  const context = await getDashboardContext();
  const snapshot = await getTenantFoundationData(context);

  return NextResponse.json(snapshot);
}

import { NextResponse } from "next/server";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { CUSTOMER_CRM_EXPORT_HEADERS } from "@/modules/customer-crm-management/constants/routes";
import {
  handlePlatformRouteError,
  protectedRoute,
} from "@/modules/platform-guards/guards/route.guards";
import { exportManagedCustomersForBusiness } from "@/services/restaurant-customer.service";

export async function GET() {
  try {
    const platform = await protectedRoute({ permission: PERMISSION_CODES.CUSTOMER_EXPORT });
    const rows = await exportManagedCustomersForBusiness(platform.business.id);
    const header = CUSTOMER_CRM_EXPORT_HEADERS.join(",");
    const body = rows
      .map((row) =>
        CUSTOMER_CRM_EXPORT_HEADERS.map((key) => {
          const value = row[key as keyof typeof row];
          return value == null ? "" : String(value).replace(/,/g, " ");
        }).join(","),
      )
      .join("\n");

    return new NextResponse(`${header}\n${body}`, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="customers-export.csv"',
      },
    });
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

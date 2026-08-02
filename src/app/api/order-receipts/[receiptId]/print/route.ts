import { NextResponse } from "next/server";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import {
  handlePlatformRouteError,
  protectedRoute,
} from "@/modules/platform-guards/guards/route.guards";
import { printOrderReceipt } from "@/services/restaurant-order-receipt.service";

export async function GET(_request: Request, context: { params: Promise<{ receiptId: string }> }) {
  try {
    const platform = await protectedRoute({ permission: PERMISSION_CODES.RECEIPT_PRINT });
    const { receiptId } = await context.params;
    const result = await printOrderReceipt(receiptId, platform.business.id, false);

    return new NextResponse(new Uint8Array(result.pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="receipt-${receiptId}.pdf"`,
      },
    });
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

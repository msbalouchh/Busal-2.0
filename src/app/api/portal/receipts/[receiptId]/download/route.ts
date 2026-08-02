import { NextResponse } from "next/server";

import { generateOrderReceiptPdf } from "@/services/restaurant-order-receipt.service";
import { getCustomerReceiptForDownload } from "@/services/customer-portal.service";
import { getCurrentUser } from "@/services/auth.service";
import { getCustomerPortalBusinessCookie } from "@/modules/customer-portal/services/customer-portal-session.service";
import { resolveCustomerPortalContext } from "@/services/customer-portal.service";

export async function GET(_request: Request, context: { params: Promise<{ receiptId: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const businessId = await getCustomerPortalBusinessCookie();
    const portalContext = await resolveCustomerPortalContext(
      user.id,
      user.email,
      user.fullName,
      businessId,
    );
    const { receiptId } = await context.params;

    const receipt = await getCustomerReceiptForDownload(
      portalContext.business.id,
      portalContext.customer.id,
      receiptId,
    );

    const pdf = await generateOrderReceiptPdf(receipt.id, portalContext.business.id);

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="receipt-${receipt.receiptNumber}.pdf"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to download receipt.";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}

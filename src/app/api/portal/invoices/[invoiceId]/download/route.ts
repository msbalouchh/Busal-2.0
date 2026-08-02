import { NextResponse } from "next/server";

import { getCustomerPortalBusinessCookie } from "@/modules/customer-portal/services/customer-portal-session.service";
import {
  getCustomerInvoiceDetail,
  resolveCustomerPortalContext,
} from "@/services/customer-portal.service";
import { getCurrentUser } from "@/services/auth.service";

export async function GET(_request: Request, context: { params: Promise<{ invoiceId: string }> }) {
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
    const { invoiceId } = await context.params;

    const invoice = await getCustomerInvoiceDetail(
      portalContext.business.id,
      portalContext.customer.id,
      invoiceId,
    );

    const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Invoice ${invoice.invoiceNumber}</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 32px; color: #111; }
      h1 { margin-bottom: 8px; }
      table { width: 100%; border-collapse: collapse; margin-top: 24px; }
      th, td { border-bottom: 1px solid #ddd; padding: 8px; text-align: left; }
      .totals { margin-top: 24px; }
    </style>
  </head>
  <body>
    <h1>Invoice ${invoice.invoiceNumber}</h1>
    <p>Status: ${invoice.status}</p>
    <p>Issued: ${invoice.issuedAt ?? "—"}</p>
    <p>Due: ${invoice.dueAt ?? "—"}</p>
    <table>
      <thead>
        <tr><th>Description</th><th>Qty</th><th>Unit</th><th>Total</th></tr>
      </thead>
      <tbody>
        ${invoice.lineItems
          .map(
            (item) =>
              `<tr><td>${item.description}</td><td>${item.quantity}</td><td>${item.unitPriceFormatted}</td><td>${item.totalFormatted}</td></tr>`,
          )
          .join("")}
      </tbody>
    </table>
    <div class="totals">
      <p>Subtotal: ${invoice.subtotalFormatted}</p>
      <p>Tax: ${invoice.taxFormatted}</p>
      <p><strong>Total: ${invoice.totalFormatted}</strong></p>
      <p>Paid: ${invoice.amountPaidFormatted}</p>
    </div>
  </body>
</html>`;

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `attachment; filename="invoice-${invoice.invoiceNumber}.html"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to download invoice.";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}

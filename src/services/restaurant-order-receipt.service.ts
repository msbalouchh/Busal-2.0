import "server-only";

import PDFDocument from "pdfkit";

import { prisma } from "@/lib/prisma";
import { resolvePublicAppUrl } from "@/config/app-url";
import { ORDER_RECEIPT_PRINT_API } from "@/modules/payment-receipt-management/constants/routes";
import type { OrderReceiptRecord } from "@/modules/payment-receipt-management/types/payment-receipt-types";

async function nextReceiptNumber(businessId: string): Promise<string> {
  const sequence = await prisma.orderReceiptSequence.upsert({
    where: { businessId },
    create: { businessId, lastNumber: 1 },
    update: { lastNumber: { increment: 1 } },
  });

  return `RCP-${String(sequence.lastNumber).padStart(6, "0")}`;
}

export async function createOrderReceiptForPayment(paymentId: string): Promise<OrderReceiptRecord> {
  const existing = await prisma.orderReceipt.findUnique({ where: { paymentId } });
  if (existing) {
    return {
      id: existing.id,
      receiptNumber: existing.receiptNumber,
      receiptUrl: existing.receiptUrl,
      printedCount: existing.printedCount,
      emailedAt: existing.emailedAt?.toISOString() ?? null,
      smsSentAt: existing.smsSentAt?.toISOString() ?? null,
      createdAt: existing.createdAt.toISOString(),
    };
  }

  const payment = await prisma.orderPayment.findUnique({
    where: { id: paymentId },
    select: { businessId: true },
  });

  if (!payment) throw new Error("Payment not found");

  const receiptNumber = await nextReceiptNumber(payment.businessId);

  const receipt = await prisma.orderReceipt.create({
    data: {
      businessId: payment.businessId,
      paymentId,
      receiptNumber,
    },
  });

  const finalUrl = `${resolvePublicAppUrl()}${ORDER_RECEIPT_PRINT_API(receipt.id)}`;
  const updated = await prisma.orderReceipt.update({
    where: { id: receipt.id },
    data: { receiptUrl: finalUrl },
  });

  return {
    id: updated.id,
    receiptNumber: updated.receiptNumber,
    receiptUrl: updated.receiptUrl,
    printedCount: updated.printedCount,
    emailedAt: updated.emailedAt?.toISOString() ?? null,
    smsSentAt: updated.smsSentAt?.toISOString() ?? null,
    createdAt: updated.createdAt.toISOString(),
  };
}

export async function getOrderReceipt(receiptId: string, businessId: string) {
  const receipt = await prisma.orderReceipt.findFirst({
    where: { id: receiptId, payment: { businessId } },
    include: {
      payment: {
        include: {
          order: {
            include: {
              items: { include: { modifiers: true } },
              restaurantTable: { select: { tableNumber: true, tableName: true } },
              customer: { select: { name: true, phone: true, email: true } },
              business: {
                select: {
                  businessName: true,
                  phone: true,
                  businessEmail: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!receipt) throw new Error("Receipt not found");
  return receipt;
}

export async function generateOrderReceiptPdf(
  receiptId: string,
  businessId: string,
): Promise<Buffer> {
  const receipt = await getOrderReceipt(receiptId, businessId);
  const payment = receipt.payment;
  const order = payment.order;
  const business = order.business;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 40 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc
      .fontSize(18)
      .font("Helvetica-Bold")
      .text(business.businessName ?? "Receipt");
    doc.fontSize(10).font("Helvetica");
    if (business.phone) doc.text(business.phone);
    if (business.businessEmail) doc.text(business.businessEmail);
    doc.moveDown();

    doc.fontSize(12).font("Helvetica-Bold").text(`Receipt ${receipt.receiptNumber}`);
    doc.font("Helvetica").fontSize(10);
    doc.text(`Payment ${payment.paymentNumber}`);
    doc.text(`Order ${order.orderNumber}`);
    if (order.restaurantTable) {
      doc.text(`Table ${order.restaurantTable.tableName ?? order.restaurantTable.tableNumber}`);
    }
    doc.text(`Method ${payment.paymentMethod}`);
    doc.text(`Paid ${payment.paidAt?.toLocaleString() ?? "—"}`);
    doc.moveDown();

    for (const item of order.items) {
      doc.text(
        `${item.quantity}x ${item.productNameSnapshot} — £${Number(item.totalAmount).toFixed(2)}`,
      );
      for (const modifier of item.modifiers) {
        doc.text(`  + ${modifier.nameSnapshot}`);
      }
    }

    doc.moveDown();
    doc.text(`Subtotal: £${Number(order.subtotal).toFixed(2)}`);
    doc.text(`Discount: £${Number(order.discountAmount).toFixed(2)}`);
    doc.text(`Tax: £${Number(order.taxAmount).toFixed(2)}`);
    doc.text(`Service: £${Number(order.serviceCharge).toFixed(2)}`);
    doc.text(`Tip: £${Number(payment.tipAmount).toFixed(2)}`);
    doc.font("Helvetica-Bold").text(`Paid: £${Number(payment.amountPaid).toFixed(2)}`);
    if (Number(payment.changeGiven) > 0) {
      doc.font("Helvetica").text(`Change: £${Number(payment.changeGiven).toFixed(2)}`);
    }

    doc.end();
  });
}

export async function printOrderReceipt(receiptId: string, businessId: string, isReprint = false) {
  const pdf = await generateOrderReceiptPdf(receiptId, businessId);

  await prisma.orderReceipt.update({
    where: { id: receiptId },
    data: {
      printedCount: { increment: 1 },
    },
  });

  return { pdf, isReprint };
}

export async function emailOrderReceipt(receiptId: string, businessId: string, email: string) {
  if (!email.trim()) throw new Error("Email is required");

  await getOrderReceipt(receiptId, businessId);

  await prisma.orderReceipt.update({
    where: { id: receiptId },
    data: { emailedAt: new Date() },
  });

  return { success: true as const, email: email.trim() };
}

export async function smsOrderReceipt(receiptId: string, businessId: string, phone: string) {
  if (!phone.trim()) throw new Error("Phone is required");

  await getOrderReceipt(receiptId, businessId);

  await prisma.orderReceipt.update({
    where: { id: receiptId },
    data: { smsSentAt: new Date() },
  });

  return { success: true as const, phone: phone.trim() };
}

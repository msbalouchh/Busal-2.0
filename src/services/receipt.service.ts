import "server-only";

import {
  type PaymentMethod,
  type Prisma,
  type ReceiptAuditAction,
  type ReceiptPaperSize,
  type ReceiptPrintStatus,
  type ReceiptTemplateType,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { runInteractiveTransaction } from "@/lib/prisma-transaction";
import { branchFilter } from "@/modules/business-context/utils/branch-scope";
import {
  DEFAULT_PAYMENT_CURRENCY,
  DEFAULT_PAYMENT_LOCALE,
} from "@/modules/payments/constants/currency";
import { calculateChangeDuePence, moneyDecimalToPence } from "@/modules/payments/utils/currency";
import { generateReceiptPdf } from "@/modules/receipts/utils/pdf/generate-receipt-pdf";
import { buildReceiptTemplateData } from "@/modules/receipts/utils/templates/template-renderer";

export interface ReceiptItemData {
  id: string;
  name: string;
  quantity: number;
  unitPricePence: number;
  lineTotalPence: number;
  discountPence: number;
  taxRateBps: number | null;
}

export interface ReceiptData {
  id: string;
  businessId: string;
  orderId: string;
  paymentId: string;
  receiptNumber: string;
  createdByStaffId: string | null;
  businessName: string;
  businessAddress: string | null;
  businessPhone: string | null;
  businessEmail: string | null;
  customerName: string | null;
  customerPhone: string | null;
  orderNumber: string;
  tableName: string | null;
  staffName: string | null;
  paymentMethod: PaymentMethod;
  currency: string;
  locale: string;
  subtotalPence: number;
  discountPence: number;
  taxPence: number;
  totalPence: number;
  paymentAmountPence: number;
  amountTenderedPence: number | null;
  changeDuePence: number;
  printCount: number;
  lastPrintStatus: ReceiptPrintStatus | null;
  lastPrintedAt: Date | null;
  deliveryEmail: string | null;
  deliveryPhone: string | null;
  qrCodeData: string | null;
  createdAt: Date;
  items: ReceiptItemData[];
}

export interface ReceiptListItem {
  id: string;
  receiptNumber: string;
  paymentId: string;
  orderId: string;
  orderNumber: string;
  customerName: string | null;
  paymentMethod: PaymentMethod;
  paymentAmountPence: number;
  totalPence: number;
  printCount: number;
  lastPrintStatus: ReceiptPrintStatus | null;
  createdAt: Date;
}

export interface PrintReceiptOptions {
  templateType: ReceiptTemplateType;
  paperSize: ReceiptPaperSize;
  staffId?: string | null;
  isReprint?: boolean;
}

const receiptInclude = {
  items: {
    orderBy: [{ name: "asc" as const }],
  },
} satisfies Prisma.ReceiptInclude;

type ReceiptRecord = Prisma.ReceiptGetPayload<{ include: typeof receiptInclude }>;

function mapReceiptItem(item: ReceiptRecord["items"][number]): ReceiptItemData {
  return {
    id: item.id,
    name: item.name,
    quantity: item.quantity,
    unitPricePence: item.unitPricePence,
    lineTotalPence: item.lineTotalPence,
    discountPence: item.discountPence,
    taxRateBps: item.taxRateBps,
  };
}

function mapReceipt(receipt: ReceiptRecord): ReceiptData {
  return {
    id: receipt.id,
    businessId: receipt.businessId,
    orderId: receipt.orderId,
    paymentId: receipt.paymentId,
    receiptNumber: receipt.receiptNumber,
    createdByStaffId: receipt.createdByStaffId,
    businessName: receipt.businessName,
    businessAddress: receipt.businessAddress,
    businessPhone: receipt.businessPhone,
    businessEmail: receipt.businessEmail,
    customerName: receipt.customerName,
    customerPhone: receipt.customerPhone,
    orderNumber: receipt.orderNumber,
    tableName: receipt.tableName,
    staffName: receipt.staffName,
    paymentMethod: receipt.paymentMethod,
    currency: receipt.currency,
    locale: receipt.locale,
    subtotalPence: receipt.subtotalPence,
    discountPence: receipt.discountPence,
    taxPence: receipt.taxPence,
    totalPence: receipt.totalPence,
    paymentAmountPence: receipt.paymentAmountPence,
    amountTenderedPence: receipt.amountTenderedPence,
    changeDuePence: receipt.changeDuePence,
    printCount: receipt.printCount,
    lastPrintStatus: receipt.lastPrintStatus,
    lastPrintedAt: receipt.lastPrintedAt,
    deliveryEmail: receipt.deliveryEmail,
    deliveryPhone: receipt.deliveryPhone,
    qrCodeData: receipt.qrCodeData,
    createdAt: receipt.createdAt,
    items: receipt.items.map(mapReceiptItem),
  };
}

function mapReceiptListItem(receipt: ReceiptRecord): ReceiptListItem {
  return {
    id: receipt.id,
    receiptNumber: receipt.receiptNumber,
    paymentId: receipt.paymentId,
    orderId: receipt.orderId,
    orderNumber: receipt.orderNumber,
    customerName: receipt.customerName,
    paymentMethod: receipt.paymentMethod,
    paymentAmountPence: receipt.paymentAmountPence,
    totalPence: receipt.totalPence,
    printCount: receipt.printCount,
    lastPrintStatus: receipt.lastPrintStatus,
    createdAt: receipt.createdAt,
  };
}

async function allocateReceiptNumber(
  businessId: string,
  tx: Prisma.TransactionClient,
): Promise<string> {
  const sequence = await tx.receiptSequence.upsert({
    where: { businessId },
    create: { businessId, lastNumber: 1 },
    update: { lastNumber: { increment: 1 } },
  });

  return `R-${String(sequence.lastNumber).padStart(6, "0")}`;
}

async function logReceiptAudit(
  tx: Prisma.TransactionClient,
  input: {
    receiptId: string;
    businessId: string;
    staffId?: string | null;
    action: ReceiptAuditAction;
    metadata?: Prisma.InputJsonValue;
  },
): Promise<void> {
  await tx.receiptAuditLog.create({
    data: {
      receiptId: input.receiptId,
      businessId: input.businessId,
      staffId: input.staffId ?? null,
      action: input.action,
      metadata: input.metadata,
    },
  });
}

async function loadBusinessSnapshot(businessId: string) {
  const business = await prisma.business.findFirst({
    where: { id: businessId },
    select: {
      businessName: true,
      branches: {
        where: { isMain: true },
        take: 1,
        select: { address: true, city: true, phone: true },
      },
      contacts: {
        select: { type: true, value: true, isPrimary: true },
      },
    },
  });

  if (!business) {
    throw new Error("Business not found");
  }

  const mainBranch = business.branches[0];
  const phoneContact = business.contacts.find(
    (contact) => contact.type === "PHONE" && contact.isPrimary,
  );
  const emailContact = business.contacts.find(
    (contact) => contact.type === "EMAIL" && contact.isPrimary,
  );
  const addressParts = [mainBranch?.address, mainBranch?.city].filter(Boolean);

  return {
    businessName: business.businessName?.trim() || "Business",
    businessAddress: addressParts.length > 0 ? addressParts.join(", ") : null,
    businessPhone: phoneContact?.value ?? mainBranch?.phone ?? null,
    businessEmail: emailContact?.value ?? null,
  };
}

export async function createReceiptForPayment(
  businessId: string,
  paymentId: string,
  staffId: string | null,
  branchId: string | null = null,
): Promise<ReceiptData> {
  const existing = await prisma.receipt.findFirst({
    where: { paymentId, businessId },
    include: receiptInclude,
  });

  if (existing) {
    return mapReceipt(existing);
  }

  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, businessId, status: "COMPLETED" },
    include: {
      order: {
        include: {
          items: { orderBy: [{ createdAt: "asc" }] },
          table: { select: { name: true } },
        },
      },
      staff: { select: { firstName: true, lastName: true } },
    },
  });

  if (!payment) {
    throw new Error("Completed payment not found");
  }

  const businessSnapshot = await loadBusinessSnapshot(businessId);
  const staffName = payment.staff
    ? `${payment.staff.firstName} ${payment.staff.lastName}`.trim()
    : null;
  const changeDuePence =
    payment.amountTendered != null
      ? calculateChangeDuePence(payment.amount, payment.amountTendered)
      : 0;

  const receipt = await runInteractiveTransaction(async (tx) => {
    const receiptNumber = await allocateReceiptNumber(businessId, tx);

    const created = await tx.receipt.create({
      data: {
        businessId,
        branchId,
        orderId: payment.orderId,
        paymentId: payment.id,
        receiptNumber,
        createdByStaffId: staffId,
        businessName: businessSnapshot.businessName,
        businessAddress: businessSnapshot.businessAddress,
        businessPhone: businessSnapshot.businessPhone,
        businessEmail: businessSnapshot.businessEmail,
        customerName: payment.order.customerName,
        customerPhone: payment.order.customerPhone,
        orderNumber: payment.order.orderNumber,
        tableName: payment.order.table?.name ?? null,
        staffName,
        paymentMethod: payment.method,
        currency: DEFAULT_PAYMENT_CURRENCY,
        locale: DEFAULT_PAYMENT_LOCALE,
        subtotalPence: moneyDecimalToPence(payment.order.subtotal),
        discountPence: moneyDecimalToPence(payment.order.discount),
        taxPence: moneyDecimalToPence(payment.order.tax),
        totalPence: moneyDecimalToPence(payment.order.total),
        paymentAmountPence: payment.amount,
        amountTenderedPence: payment.amountTendered,
        changeDuePence,
        qrCodeData: payment.order.orderNumber,
        items: {
          create: payment.order.items.map((item) => ({
            name: item.nameSnapshot,
            quantity: item.quantity,
            unitPricePence: moneyDecimalToPence(item.unitPrice),
            lineTotalPence: moneyDecimalToPence(item.totalPrice),
            discountPence: 0,
            taxRateBps: null,
          })),
        },
      },
      include: receiptInclude,
    });

    await logReceiptAudit(tx, {
      receiptId: created.id,
      businessId,
      staffId,
      action: "CREATED",
      metadata: { paymentId: payment.id, orderId: payment.orderId },
    });

    return created;
  });

  return mapReceipt(receipt);
}

export async function getReceipt(receiptId: string, businessId: string): Promise<ReceiptData> {
  const receipt = await prisma.receipt.findFirst({
    where: { id: receiptId, businessId },
    include: receiptInclude,
  });

  if (!receipt) {
    throw new Error("Receipt not found");
  }

  return mapReceipt(receipt);
}

export async function getReceiptByPayment(
  paymentId: string,
  businessId: string,
): Promise<ReceiptData | null> {
  const receipt = await prisma.receipt.findFirst({
    where: { paymentId, businessId },
    include: receiptInclude,
  });

  return receipt ? mapReceipt(receipt) : null;
}

export async function listReceipts(
  businessId: string,
  branchId: string | null = null,
): Promise<ReceiptListItem[]> {
  const receipts = await prisma.receipt.findMany({
    where: { businessId, ...branchFilter(branchId) },
    include: receiptInclude,
    orderBy: [{ createdAt: "desc" }],
  });

  return receipts.map(mapReceiptListItem);
}

export async function recordReceiptView(
  receiptId: string,
  businessId: string,
  staffId: string | null,
): Promise<void> {
  const receipt = await prisma.receipt.findFirst({
    where: { id: receiptId, businessId },
    select: { id: true },
  });

  if (!receipt) {
    throw new Error("Receipt not found");
  }

  await logReceiptAudit(prisma, {
    receiptId,
    businessId,
    staffId,
    action: "VIEWED",
  });
}

async function recordPrintAttempt(
  receiptId: string,
  businessId: string,
  options: PrintReceiptOptions,
  status: ReceiptPrintStatus,
): Promise<ReceiptData> {
  const receipt = await runInteractiveTransaction(async (tx) => {
    const current = await tx.receipt.findFirst({
      where: { id: receiptId, businessId },
      include: receiptInclude,
    });

    if (!current) {
      throw new Error("Receipt not found");
    }

    await tx.receiptPrintLog.create({
      data: {
        receiptId,
        businessId,
        staffId: options.staffId ?? null,
        templateType: options.templateType,
        paperSize: options.paperSize,
        status,
        isReprint: options.isReprint ?? false,
      },
    });

    const updated = await tx.receipt.update({
      where: { id: receiptId },
      data: {
        printCount: status === "PRINTED" ? { increment: 1 } : undefined,
        lastPrintStatus: status,
        lastPrintedAt: status === "PRINTED" ? new Date() : undefined,
      },
      include: receiptInclude,
    });

    await logReceiptAudit(tx, {
      receiptId,
      businessId,
      staffId: options.staffId ?? null,
      action: options.isReprint ? "REPRINTED" : "PRINTED",
      metadata: {
        templateType: options.templateType,
        paperSize: options.paperSize,
        status,
      },
    });

    return updated;
  });

  return mapReceipt(receipt);
}

export async function printReceipt(
  receiptId: string,
  businessId: string,
  options: PrintReceiptOptions,
): Promise<{ receipt: ReceiptData; pdf: Buffer }> {
  const receipt = await getReceipt(receiptId, businessId);
  const templateData = buildReceiptTemplateData(receipt, options.templateType);

  try {
    const pdf = await generateReceiptPdf(templateData, {
      templateType: options.templateType,
      paperSize: options.paperSize,
    });
    const updatedReceipt = await recordPrintAttempt(receiptId, businessId, options, "PRINTED");

    return { receipt: updatedReceipt, pdf };
  } catch {
    await recordPrintAttempt(receiptId, businessId, options, "FAILED");
    throw new Error("Failed to generate receipt PDF");
  }
}

export async function reprintReceipt(
  receiptId: string,
  businessId: string,
  options: Omit<PrintReceiptOptions, "isReprint">,
): Promise<{ receipt: ReceiptData; pdf: Buffer }> {
  return printReceipt(receiptId, businessId, { ...options, isReprint: true });
}

export async function listReceiptPrintLogs(receiptId: string, businessId: string) {
  const receipt = await prisma.receipt.findFirst({
    where: { id: receiptId, businessId },
    select: { id: true },
  });

  if (!receipt) {
    throw new Error("Receipt not found");
  }

  return prisma.receiptPrintLog.findMany({
    where: { receiptId, businessId },
    orderBy: [{ createdAt: "desc" }],
  });
}

export async function listReceiptAuditLogs(receiptId: string, businessId: string) {
  const receipt = await prisma.receipt.findFirst({
    where: { id: receiptId, businessId },
    select: { id: true },
  });

  if (!receipt) {
    throw new Error("Receipt not found");
  }

  return prisma.receiptAuditLog.findMany({
    where: { receiptId, businessId },
    orderBy: [{ createdAt: "desc" }],
  });
}

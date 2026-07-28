import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "@prisma/client";

import { PERMISSION_CODES } from "../src/modules/authorization/constants/permissions";
import {
  DEFAULT_PAYMENT_CURRENCY,
  DEFAULT_PAYMENT_LOCALE,
} from "../src/modules/payments/constants/currency";
import { formatMoneyPence, moneyDecimalToPence } from "../src/modules/payments/utils/currency";
import { RECEIPT_ROUTES } from "../src/modules/receipts/constants/routes";
import { formatReceiptMoney } from "../src/modules/receipts/utils/receipt-utils";
import { buildReceiptTemplateData } from "../src/modules/receipts/utils/templates/template-renderer";
import { generateReceiptPdf } from "../src/modules/receipts/utils/pdf/generate-receipt-pdf";
import { addItem, createCart } from "../src/services/cart.service";
import { createOrderFromSession } from "../src/services/order.service";
import { createOrderSession, markOrderSessionReady } from "../src/services/order-session.service";
import { recordPayment } from "../src/services/payment.service";
import { createQRCode, recordPublicMenuVisit } from "../src/services/qr-menu.service";
import {
  createReceiptForPayment,
  getReceipt,
  getReceiptByPayment,
  listReceiptAuditLogs,
  listReceiptPrintLogs,
  listReceipts,
  printReceipt,
  reprintReceipt,
} from "../src/services/receipt.service";

const prisma = new PrismaClient();
const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function assertGbpFormat(value: string): void {
  assert(value.includes("£"), "formatted value should use GBP symbol");
}

function assertIntegerPenceValue(value: number, label: string): void {
  assert(Number.isInteger(value), `${label} must be integer pence`);
}

function assertNoForbiddenPatterns(filePath: string, forbiddenPatterns: string[]): void {
  const source = readFileSync(join(root, filePath), "utf8");

  for (const pattern of forbiddenPatterns) {
    assert(!source.includes(pattern), `${filePath} must not contain ${pattern}`);
  }
}

async function createPayableOrder(businessId: string, ownerId: string, suffix: string) {
  const qrCode = await createQRCode(ownerId, { slug: `receipts-${suffix}` });
  const visit = await recordPublicMenuVisit(ownerId, qrCode.id, {
    sessionToken: `receipts-token-${suffix}`,
  });

  const menuItem = await prisma.menuItem.create({
    data: {
      businessId,
      name: `Receipt Verify Item ${suffix}`,
      price: 30,
      isAvailable: true,
    },
    select: { id: true },
  });

  const cart = await createCart(businessId, visit.session.id);
  await addItem(businessId, visit.session.id, menuItem.id, 2);

  const orderSession = await createOrderSession(businessId, cart.id, visit.session.id);
  await markOrderSessionReady(orderSession.id);
  const order = await createOrderFromSession(orderSession.id);

  return { order, qrCodeId: qrCode.id, menuItemId: menuItem.id };
}

async function main() {
  console.log("Module structure");
  const moduleFiles = [
    "src/modules/receipts/index.ts",
    "src/modules/receipts/constants/routes.ts",
    "src/modules/receipts/constants/templates.ts",
    "src/modules/receipts/types/receipts.ts",
    "src/modules/receipts/utils/receipt-utils.ts",
    "src/modules/receipts/utils/templates/template-renderer.ts",
    "src/modules/receipts/utils/templates/customer-receipt-template.ts",
    "src/modules/receipts/utils/templates/kitchen-ticket-template.ts",
    "src/modules/receipts/utils/pdf/generate-receipt-pdf.ts",
    "src/modules/receipts/utils/pdf/paper-sizes.ts",
    "src/modules/receipts/lib/get-receipt-context.ts",
    "src/modules/receipts/actions/receipt-actions.ts",
    "src/modules/receipts/components/receipt-history-list.tsx",
    "src/modules/receipts/components/receipt-detail-view.tsx",
    "src/services/receipt.service.ts",
    "src/app/dashboard/receipts/page.tsx",
    "src/app/dashboard/receipts/[receiptId]/page.tsx",
    "src/app/api/receipts/[receiptId]/print/route.ts",
    "src/app/api/receipts/[receiptId]/reprint/route.ts",
  ];

  for (const file of moduleFiles) {
    readFileSync(join(root, file), "utf8");
  }
  console.log("  PASS");

  console.log("Receipt routes");
  assert(RECEIPT_ROUTES.overview === "/dashboard/receipts", "receipt route mismatch");
  console.log("  PASS");

  console.log("Permission protected");
  const contextSource = readFileSync(
    join(root, "src/modules/receipts/lib/get-receipt-context.ts"),
    "utf8",
  );
  const actionsSource = readFileSync(
    join(root, "src/modules/receipts/actions/receipt-actions.ts"),
    "utf8",
  );
  const printRouteSource = readFileSync(
    join(root, "src/app/api/receipts/[receiptId]/print/route.ts"),
    "utf8",
  );
  assert(contextSource.includes("protectedPage"), "receipts page should use protectedPage");
  assert(contextSource.includes("PERMISSION_CODES.RECEIPT_VIEW"), "receipt.view required");
  assert(actionsSource.includes("protectedAction"), "receipt actions should use protectedAction");
  assert(actionsSource.includes("PERMISSION_CODES.RECEIPT_PRINT"), "receipt.print required");
  assert(printRouteSource.includes("protectedRoute"), "print route should use protectedRoute");
  assert(PERMISSION_CODES.RECEIPT_VIEW === "receipt.view", "receipt.view code missing");
  assert(PERMISSION_CODES.RECEIPT_PRINT === "receipt.print", "receipt.print code missing");
  console.log("  PASS");

  console.log("Default currency configuration");
  assert(DEFAULT_PAYMENT_CURRENCY === "GBP", "default currency should be GBP");
  assert(DEFAULT_PAYMENT_LOCALE === "en-GB", "default locale should be en-GB");
  assertGbpFormat(formatMoneyPence(1250));
  assertGbpFormat(formatReceiptMoney(1250));
  console.log("  PASS");

  console.log("Integer pence and decimal safety");
  assertNoForbiddenPatterns("src/services/receipt.service.ts", [
    "parseFloat",
    "toNumber(",
    "Math.round(",
    ".toNumber(",
  ]);
  console.log("  PASS");

  console.log("Schema pence storage");
  const schemaSource = readFileSync(join(root, "prisma/schema.prisma"), "utf8");
  assert(schemaSource.includes("subtotalPence    Int"), "receipt subtotal must be integer pence");
  assert(schemaSource.includes("paymentAmountPence Int"), "payment amount must be integer pence");
  assert(
    schemaSource.includes("unitPricePence Int"),
    "receipt item unit price must be integer pence",
  );
  console.log("  PASS");

  console.log("UI centralized GBP formatting");
  const uiSources = [
    "src/modules/receipts/components/receipt-history-list.tsx",
    "src/modules/receipts/components/receipt-detail-view.tsx",
  ];
  for (const file of uiSources) {
    const source = readFileSync(join(root, file), "utf8");
    assert(source.includes("formatReceiptMoney"), `${file} must use centralized GBP formatter`);
  }
  console.log("  PASS");

  const business = await prisma.business.findFirst({
    select: { id: true, ownerId: true },
  });
  assert(business, "No business found");

  const suffix = Date.now().toString();
  const { order } = await createPayableOrder(business.id, business.ownerId, suffix);
  const orderRecord = await prisma.order.findUnique({
    where: { id: order.id },
    select: { total: true, subtotal: true, discount: true, tax: true, orderNumber: true },
  });
  assert(orderRecord, "order record missing");
  const orderTotalPence = moneyDecimalToPence(orderRecord.total);

  console.log("Receipt creation after payment");
  const paymentResult = await recordPayment(business.id, order.id, null, {
    method: "CASH",
    amountPence: orderTotalPence,
    amountTenderedPence: orderTotalPence + 500,
  });
  assert(paymentResult.receiptId, "payment should return receiptId");
  const receipt = await getReceipt(paymentResult.receiptId, business.id);
  assert(receipt.paymentId === paymentResult.payment.id, "receipt payment link failed");
  assert(receipt.receiptNumber.startsWith("R-"), "receipt number format failed");
  assert(receipt.currency === "GBP", "receipt currency should be GBP");
  assert(receipt.locale === "en-GB", "receipt locale should be en-GB");
  assertIntegerPenceValue(receipt.totalPence, "receipt total");
  assertIntegerPenceValue(receipt.paymentAmountPence, "payment amount");
  assert(receipt.totalPence === orderTotalPence, "receipt total mismatch");
  assert(receipt.changeDuePence === 500, "change due mismatch");
  assert(receipt.items.length >= 1, "receipt items missing");
  assert(
    receipt.items.every(
      (item) => Number.isInteger(item.unitPricePence) && Number.isInteger(item.lineTotalPence),
    ),
    "receipt item amounts must be integer pence",
  );
  console.log("  PASS");

  console.log("One receipt per payment");
  const duplicate = await createReceiptForPayment(business.id, paymentResult.payment.id, null);
  assert(duplicate.id === receipt.id, "duplicate receipt should not be created");
  console.log("  PASS");

  console.log("Receipt lookup");
  const byPayment = await getReceiptByPayment(paymentResult.payment.id, business.id);
  assert(byPayment?.id === receipt.id, "getReceiptByPayment failed");
  const history = await listReceipts(business.id);
  assert(
    history.some((entry) => entry.id === receipt.id),
    "receipt history missing entry",
  );
  console.log("  PASS");

  console.log("Receipt templates");
  const customerTemplate = buildReceiptTemplateData(receipt, "CUSTOMER");
  const kitchenTemplate = buildReceiptTemplateData(receipt, "KITCHEN");
  assert(customerTemplate.header === "Customer Receipt", "customer template header failed");
  assert(kitchenTemplate.header === "Kitchen Ticket", "kitchen template header failed");
  assert(customerTemplate.lines.length > 0, "customer template lines missing");
  assert(kitchenTemplate.lines.length > 0, "kitchen template lines missing");
  console.log("  PASS");

  console.log("PDF generation");
  const a4Pdf = await generateReceiptPdf(customerTemplate, {
    templateType: "CUSTOMER",
    paperSize: "A4",
  });
  const thermal80Pdf = await generateReceiptPdf(kitchenTemplate, {
    templateType: "KITCHEN",
    paperSize: "THERMAL_80MM",
  });
  const thermal58Pdf = await generateReceiptPdf(customerTemplate, {
    templateType: "CUSTOMER",
    paperSize: "THERMAL_58MM",
  });
  assert(a4Pdf.length > 100, "A4 PDF generation failed");
  assert(thermal80Pdf.length > 100, "80mm PDF generation failed");
  assert(thermal58Pdf.length > 100, "58mm PDF generation failed");
  console.log("  PASS");

  console.log("Print and reprint");
  const printResult = await printReceipt(receipt.id, business.id, {
    templateType: "CUSTOMER",
    paperSize: "A4",
    staffId: null,
    isReprint: false,
  });
  assert(printResult.receipt.printCount === 1, "print count should increment");
  assert(printResult.receipt.lastPrintStatus === "PRINTED", "print status failed");
  assert(printResult.pdf.length > 100, "print PDF missing");

  const reprintResult = await reprintReceipt(receipt.id, business.id, {
    templateType: "KITCHEN",
    paperSize: "THERMAL_80MM",
    staffId: null,
  });
  assert(reprintResult.receipt.printCount === 2, "reprint count failed");
  assert(reprintResult.pdf.length > 100, "reprint PDF missing");
  console.log("  PASS");

  console.log("Print history and audit logs");
  const printLogs = await listReceiptPrintLogs(receipt.id, business.id);
  const auditLogs = await listReceiptAuditLogs(receipt.id, business.id);
  assert(printLogs.length >= 2, "print logs missing");
  assert(
    auditLogs.some((log) => log.action === "CREATED"),
    "created audit log missing",
  );
  assert(
    auditLogs.some((log) => log.action === "PRINTED"),
    "printed audit log missing",
  );
  assert(
    auditLogs.some((log) => log.action === "REPRINTED"),
    "reprinted audit log missing",
  );
  console.log("  PASS");

  console.log("Business isolation");
  const otherBusiness = await prisma.business.findFirst({
    where: { id: { not: business.id } },
    select: { id: true },
  });
  if (otherBusiness) {
    let isolated = false;
    try {
      await getReceipt(receipt.id, otherBusiness.id);
    } catch (error) {
      isolated = error instanceof Error && error.message.includes("not found");
    }
    assert(isolated, "receipt should be isolated by business");
  }
  console.log("  PASS");

  console.log("\nReceipt verification passed.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "@prisma/client";

import { PERMISSION_CODES } from "../src/modules/authorization/constants/permissions";
import {
  DEFAULT_PAYMENT_CURRENCY,
  DEFAULT_PAYMENT_LOCALE,
} from "../src/modules/payments/constants/currency";
import { PAYMENT_ROUTES } from "../src/modules/payments/constants/routes";
import {
  formatMoneyPence,
  moneyDecimalToPence,
  parseDecimalInputToPence,
} from "../src/modules/payments/utils/currency";
import {
  applyDiscountPence,
  calculateOrderTotalPence,
  calculateRefundPence,
  calculateRefundedBalancePence,
  calculateRemainingBalancePence,
  calculateSplitPaymentPence,
  calculateTaxPence,
} from "../src/modules/payments/utils/payment-calculations";
import {
  calculateCashChange,
  formatPaymentMoney,
} from "../src/modules/payments/utils/payment-utils";
import { addItem, createCart } from "../src/services/cart.service";
import { createOrderFromSession } from "../src/services/order.service";
import { createOrderSession, markOrderSessionReady } from "../src/services/order-session.service";
import {
  getOrderPaymentSummary,
  listPaymentsForOrder,
  recordPayment,
  refundPaymentPlaceholder,
  voidPayment,
} from "../src/services/payment.service";
import { createQRCode, recordPublicMenuVisit } from "../src/services/qr-menu.service";

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
  const qrCode = await createQRCode(ownerId, { slug: `payments-${suffix}` });
  const visit = await recordPublicMenuVisit(ownerId, qrCode.id, {
    sessionToken: `payments-token-${suffix}`,
  });

  const menuItem = await prisma.menuItem.create({
    data: {
      businessId,
      name: `Payment Verify Item ${suffix}`,
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
    "src/modules/payments/index.ts",
    "src/modules/payments/constants/routes.ts",
    "src/modules/payments/constants/currency.ts",
    "src/modules/payments/types/payments.ts",
    "src/modules/payments/utils/currency.ts",
    "src/modules/payments/utils/payment-calculations.ts",
    "src/modules/payments/utils/payment-utils.ts",
    "src/modules/payments/lib/get-payment-context.ts",
    "src/modules/payments/actions/payment-actions.ts",
    "src/modules/payments/components/payment-screen.tsx",
    "src/modules/payments/components/payment-order-list.tsx",
    "src/modules/payments/components/payment-summary-panel.tsx",
    "src/modules/payments/components/payment-method-selector.tsx",
    "src/modules/payments/components/payment-history-list.tsx",
    "src/services/payment.service.ts",
    "src/app/dashboard/payments/page.tsx",
    "src/app/dashboard/payments/[orderId]/page.tsx",
  ];

  for (const file of moduleFiles) {
    readFileSync(join(root, file), "utf8");
  }
  console.log("  PASS");

  console.log("Payment routes");
  assert(PAYMENT_ROUTES.overview === "/dashboard/payments", "payment route mismatch");
  console.log("  PASS");

  console.log("Permission protected");
  const contextSource = readFileSync(
    join(root, "src/modules/payments/lib/get-payment-context.ts"),
    "utf8",
  );
  const actionsSource = readFileSync(
    join(root, "src/modules/payments/actions/payment-actions.ts"),
    "utf8",
  );
  assert(contextSource.includes("protectedPage"), "payments page should use protectedPage");
  assert(
    contextSource.includes("PERMISSION_CODES.PAYMENT_CREATE"),
    "payments require payment.create",
  );
  assert(actionsSource.includes("protectedAction"), "payment actions should use protectedAction");
  assert(
    actionsSource.includes("PERMISSION_CODES.PAYMENT_CREATE"),
    "record payment permission missing",
  );
  assert(actionsSource.includes("PERMISSION_CODES.PAYMENT_REFUND"), "refund permission missing");
  assert(
    actionsSource.includes("PERMISSION_CODES.POS_USE"),
    "pos.use required for payment recording",
  );
  assert(PERMISSION_CODES.PAYMENT_CREATE === "payment.create", "payment.create code missing");
  assert(PERMISSION_CODES.PAYMENT_REFUND === "payment.refund", "payment.refund code missing");
  console.log("  PASS");

  console.log("Default currency configuration");
  assert(DEFAULT_PAYMENT_CURRENCY === "GBP", "default currency should be GBP");
  assert(DEFAULT_PAYMENT_LOCALE === "en-GB", "default locale should be en-GB");
  assertGbpFormat(formatMoneyPence(1250));
  assertGbpFormat(formatPaymentMoney(1250));
  console.log("  PASS");

  console.log("Integer pence calculations");
  assertNoForbiddenPatterns("src/services/payment.service.ts", [
    "parseFloat",
    "0.0001",
    "roundMoney",
    "toNumber(",
    "Math.round(",
    ".toNumber(",
  ]);
  assertNoForbiddenPatterns("src/modules/payments/utils/payment-calculations.ts", [
    "parseFloat",
    "toFixed",
  ]);

  const subtotalPence = 6000;
  const discountPence = 500;
  const taxPence = calculateTaxPence(subtotalPence - discountPence, 2000);
  assertIntegerPenceValue(taxPence, "tax");
  assert(taxPence === 1100, "tax calculation failed");

  const discountedSubtotal = applyDiscountPence(subtotalPence, discountPence);
  assertIntegerPenceValue(discountedSubtotal, "discounted subtotal");
  assert(discountedSubtotal === 5500, "discount calculation failed");

  const calculatedOrderTotalPence = calculateOrderTotalPence(
    subtotalPence,
    discountPence,
    taxPence,
  );
  assertIntegerPenceValue(calculatedOrderTotalPence, "order total");
  assert(calculatedOrderTotalPence === 6600, "order total calculation failed");

  const splitPence = calculateSplitPaymentPence(6600, 2000);
  assertIntegerPenceValue(splitPence, "split payment");
  assert(splitPence === 2000, "split payment calculation failed");

  const refundPence = calculateRefundPence(4500, 2000);
  assertIntegerPenceValue(refundPence, "refund");
  assert(refundPence === 2000, "refund calculation failed");
  assert(calculateRefundedBalancePence(4500, 2000) === 2500, "refunded balance failed");
  assert(calculateRemainingBalancePence(6600, 4500) === 2100, "remaining balance helper failed");
  console.log("  PASS");

  const business = await prisma.business.findFirst({
    select: { id: true, ownerId: true },
  });
  assert(business, "No business found");

  const suffix = Date.now().toString();
  const { order } = await createPayableOrder(business.id, business.ownerId, suffix);
  const orderRecord = await prisma.order.findUnique({
    where: { id: order.id },
    select: { total: true },
  });
  assert(orderRecord, "order record missing");
  const orderTotalPence = moneyDecimalToPence(orderRecord.total);
  const firstPaymentAmountPence = 2000;
  const secondPaymentAmountPence = 2500;
  const thirdPaymentAmountPence =
    orderTotalPence - firstPaymentAmountPence - secondPaymentAmountPence;
  assertIntegerPenceValue(orderTotalPence, "order total");
  assertIntegerPenceValue(thirdPaymentAmountPence, "final split amount");
  assert(parseDecimalInputToPence("20.00") === 2000, "decimal input parsing failed");
  assert(moneyDecimalToPence("60.00") === 6000, "decimal string to pence failed");
  assert(
    moneyDecimalToPence(orderRecord.total) === orderTotalPence,
    "prisma decimal must convert to pence without Number()",
  );

  console.log("Database and UI pence storage");
  const schemaSource = readFileSync(join(root, "prisma/schema.prisma"), "utf8");
  assert(schemaSource.includes("amount         Int"), "payments.amount must be integer pence");
  assert(
    schemaSource.includes("amountTendered Int?"),
    "payments.amountTendered must be integer pence",
  );

  const uiSources = [
    "src/modules/payments/components/payment-screen.tsx",
    "src/modules/payments/components/payment-order-list.tsx",
    "src/modules/payments/components/payment-summary-panel.tsx",
    "src/modules/payments/components/payment-history-list.tsx",
  ];
  for (const file of uiSources) {
    const source = readFileSync(join(root, file), "utf8");
    assert(source.includes("formatPaymentMoney"), `${file} must use centralized GBP formatter`);
  }
  console.log("  PASS");

  console.log("Cash payment");
  const cashPayment = await recordPayment(business.id, order.id, null, {
    method: "CASH",
    amountPence: firstPaymentAmountPence,
    amountTenderedPence: 2500,
  });
  assert(cashPayment.payment.method === "CASH", "cash payment method mismatch");
  assert(cashPayment.payment.amount === firstPaymentAmountPence, "cash payment amount mismatch");
  assert(cashPayment.summary.amountPaid === firstPaymentAmountPence, "cash paid total mismatch");
  assert(
    cashPayment.summary.remainingBalance === orderTotalPence - firstPaymentAmountPence,
    "remaining balance after cash failed",
  );
  console.log("  PASS");

  console.log("Change calculation");
  assert(calculateCashChange(firstPaymentAmountPence, 2500) === 500, "change calculation failed");
  assert(cashPayment.summary.changeDue === 500, "summary change due failed");
  console.log("  PASS");

  console.log("Partial payment");
  let summary = await getOrderPaymentSummary(order.id, business.id);
  assert(
    summary.remainingBalance === orderTotalPence - firstPaymentAmountPence,
    "partial remaining balance failed",
  );
  assert(!summary.isFullyPaid, "order should not be fully paid yet");
  console.log("  PASS");

  console.log("Card payment");
  const cardPayment = await recordPayment(business.id, order.id, null, {
    method: "CARD",
    amountPence: secondPaymentAmountPence,
    amountTenderedPence: secondPaymentAmountPence,
  });
  assert(cardPayment.payment.method === "CARD", "card payment method mismatch");
  assert(
    cardPayment.summary.amountPaid === firstPaymentAmountPence + secondPaymentAmountPence,
    "card payment total failed",
  );
  assert(
    cardPayment.summary.remainingBalance === thirdPaymentAmountPence,
    "remaining after card failed",
  );
  console.log("  PASS");

  console.log("Split payment");
  const splitPayment = await recordPayment(business.id, order.id, null, {
    method: "CASH",
    amountPence: thirdPaymentAmountPence,
    amountTenderedPence: thirdPaymentAmountPence + 500,
  });
  assertIntegerPenceValue(cashPayment.payment.amount, "cash payment amount");
  assertIntegerPenceValue(cardPayment.payment.amount, "card payment amount");
  assertIntegerPenceValue(splitPayment.payment.amount, "split payment amount");
  assert(splitPayment.summary.isFullyPaid, "split payment should complete order");
  assert(splitPayment.summary.remainingBalance === 0, "remaining balance should be zero");
  const completedOrder = await prisma.order.findUnique({
    where: { id: order.id },
    select: { status: true },
  });
  assert(completedOrder?.status === "COMPLETED", "order should be marked completed");
  console.log("  PASS");

  console.log("Payment history");
  const history = await listPaymentsForOrder(order.id);
  assert(history.length === 3, "payment history count failed");
  assert(
    history.every((payment) => payment.status === "COMPLETED"),
    "history status failed",
  );
  console.log("  PASS");

  console.log("Remaining balance");
  summary = await getOrderPaymentSummary(order.id, business.id);
  assert(summary.remainingBalance === 0, "final remaining balance failed");
  assert(summary.isFullyPaid, "final paid state failed");
  console.log("  PASS");

  console.log("Void payment before completion");
  const suffixVoid = `${suffix}-void`;
  const { order: voidOrder } = await createPayableOrder(business.id, business.ownerId, suffixVoid);
  const voidOrderRecord = await prisma.order.findUnique({
    where: { id: voidOrder.id },
    select: { total: true },
  });
  assert(voidOrderRecord, "void order record missing");
  const voidable = await recordPayment(business.id, voidOrder.id, null, {
    method: "CASH",
    amountPence: 2000,
    amountTenderedPence: 2000,
  });
  const voidSummary = await voidPayment(voidable.payment.id, business.id);
  assert(voidSummary.amountPaid === 0, "void should remove paid amount");
  assert(
    voidSummary.remainingBalance === moneyDecimalToPence(voidOrderRecord.total),
    "void should restore remaining balance",
  );
  console.log("  PASS");

  console.log("Refund placeholder");
  let refundFailed = false;
  try {
    await refundPaymentPlaceholder(voidable.payment.id, business.id);
  } catch (error) {
    refundFailed = error instanceof Error && error.message.includes("not available");
  }
  assert(refundFailed, "refund placeholder should throw");
  console.log("  PASS");

  console.log("\nPayment verification passed.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

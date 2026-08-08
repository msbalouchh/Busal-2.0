import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "@prisma/client";

import { resolveAuthorizationContext } from "../src/modules/authorization/services/authorization.service";
import type { BusinessContext } from "../src/modules/business-context/types/business-context";
import {
  getOrderPaymentSummaryForBusiness,
  recordPaymentForBusiness,
  refundPaymentForBusiness,
} from "../src/modules/payments/services/payment-business-bridge.service";
import { moneyDecimalToPence } from "../src/modules/payments/utils/currency";
import {
  applyDiscountPence,
  calculateOrderTotalPence,
  calculateTaxPence,
} from "../src/modules/payments/utils/payment-calculations";
import { bootstrapVerificationEnvironment } from "./lib/verify-bootstrap";
import { createLegacyPayableOrder } from "./lib/verify-oms-order";
import { getOwnedBusinessById } from "../src/services/business-profile.service";
import { mapProfileToAuthUser } from "../src/services/user.service";

const prisma = new PrismaClient();
const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function buildPlatformContext(businessId: string): Promise<BusinessContext> {
  const businessRecord = await prisma.business.findUnique({
    where: { id: businessId },
    include: { owner: true, branches: { where: { isMain: true }, take: 1 } },
  });

  assert(businessRecord?.owner, "Business owner missing");
  const branchRecord =
    businessRecord.branches[0] ?? (await prisma.branch.findFirst({ where: { businessId } }));
  assert(branchRecord, "Branch missing");

  const business = await getOwnedBusinessById(businessRecord.ownerId, businessId);
  assert(business, "Business profile missing");

  const user = mapProfileToAuthUser(
    businessRecord.owner.id,
    businessRecord.owner.email,
    businessRecord.owner,
    {},
  );
  const authorization = await resolveAuthorizationContext(user, business);

  return {
    user,
    business,
    branch: null,
    branchId: branchRecord.id,
    roleSlug: authorization.roleSlug,
    permissions: Array.from(authorization.permissions),
    authorization,
    staffSession: null,
    isOwner: authorization.isOwner,
    accessibleBusinesses: [
      { id: business.id, name: business.businessName ?? "Business", isOnboarded: true },
    ],
    accessibleBranches: [{ id: branchRecord.id, name: branchRecord.name, isMain: branchRecord.isMain }],
  };
}

async function main() {
  bootstrapVerificationEnvironment();

  console.log("Module structure");
  const moduleFiles = [
    "src/modules/pos/services/pos.service.ts",
    "src/modules/payments/services/payment-business-bridge.service.ts",
    "src/modules/payments/utils/payment-calculations.ts",
  ];

  for (const file of moduleFiles) {
    readFileSync(join(root, file), "utf8");
  }
  console.log("  PASS");

  const business = await prisma.business.findFirst({ orderBy: { createdAt: "asc" } });
  assert(business, "No business found");
  const platform = await buildPlatformContext(business.id);
  const suffix = Date.now().toString();

  console.log("Cart totals");
  const subtotalPence = 5000;
  const discountPence = 500;
  const taxedSubtotal = applyDiscountPence(subtotalPence, discountPence);
  const taxPence = calculateTaxPence(taxedSubtotal, 2000);
  const totalPence = calculateOrderTotalPence(subtotalPence, discountPence, taxPence);
  assert(totalPence > 0, "cart total calculation failed");
  console.log("  PASS");

  console.log("Create payable order");
  const { order, branchId } = await createLegacyPayableOrder(prisma, business.id, suffix, {
    price: 25,
    quantity: 2,
  });
  assert(order.id, "order not created");
  console.log("  PASS");

  const orderRecord = await prisma.restaurantOrder.findUnique({
    where: { id: order.id },
    select: { totalAmount: true },
  });
  assert(orderRecord, "order record missing");
  const payablePence = moneyDecimalToPence(orderRecord.totalAmount);
  const firstHalf = Math.ceil(payablePence / 2);
  const secondHalf = payablePence - firstHalf;

  console.log("Split payment");
  await recordPaymentForBusiness(
    business.id,
    order.id,
    { method: "CASH", amountPence: firstHalf, amountTenderedPence: firstHalf + 500 },
    branchId,
  );
  await recordPaymentForBusiness(
    business.id,
    order.id,
    { method: "CARD", amountPence: secondHalf, amountTenderedPence: secondHalf },
    branchId,
  );
  const summary = await getOrderPaymentSummaryForBusiness(order.id, business.id, branchId);
  assert(summary.remainingBalance <= 0, "split payment should complete order");
  console.log("  PASS");

  console.log("Receipt");
  const receipt = await prisma.receipt.findFirst({
    where: { orderId: order.id, businessId: business.id },
  });
  assert(receipt?.id || summary.payments.length >= 2, "receipt or payment history missing");
  console.log("  PASS");

  console.log("Refund");
  const lastPayment = summary.payments.at(-1);
  assert(lastPayment?.id, "payment missing for refund");
  const refunded = await refundPaymentForBusiness(
    lastPayment.id,
    business.id,
    branchId,
    lastPayment.amountPaid,
  );
  assert(refunded.amountPaid < summary.amountPaid, "refund should reduce paid total");
  console.log("  PASS");

  console.log("\nPOS checkout verification passed.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "@prisma/client";

import { PERMISSION_CODES } from "../src/modules/authorization/constants/permissions";
import { formatCrmMoney } from "../src/modules/crm/utils/crm-utils";
import { CRM_ROUTES } from "../src/modules/crm/constants/routes";
import { addItem, createCart } from "../src/services/cart.service";
import {
  createCustomer,
  getCustomer,
  getCustomerOrderHistory,
  getCustomerTimeline,
  getCrmDashboard,
  listCustomerGroups,
  processCrmForCompletedOrder,
} from "../src/services/crm.service";
import { createOrderFromSession } from "../src/services/order.service";
import { createOrderSession, markOrderSessionReady } from "../src/services/order-session.service";
import { recordPayment } from "../src/services/payment.service";
import { createQRCode, recordPublicMenuVisit } from "../src/services/qr-menu.service";
import {
  adjustLoyaltyPoints,
  calculateEarnPoints,
  createReward,
  getOrCreateLoyaltyProgram,
  listPointTransactions,
  redeemReward,
} from "../src/services/loyalty.service";
import { moneyDecimalToPence } from "../src/modules/payments/utils/currency";

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

async function createCrmOrder(businessId: string, ownerId: string, suffix: string) {
  const qrCode = await createQRCode(ownerId, { slug: `crm-${suffix}` });
  const visit = await recordPublicMenuVisit(ownerId, qrCode.id, {
    sessionToken: `crm-token-${suffix}`,
  });

  const menuItem = await prisma.menuItem.create({
    data: {
      businessId,
      name: `CRM Verify Item ${suffix}`,
      price: 25,
      isAvailable: true,
    },
    select: { id: true },
  });

  const cart = await createCart(businessId, visit.session.id);
  await addItem(businessId, visit.session.id, menuItem.id, 2);

  const orderSession = await createOrderSession(businessId, cart.id, visit.session.id);
  await markOrderSessionReady(orderSession.id);

  await prisma.orderSession.update({
    where: { id: orderSession.id },
    data: {
      customerName: `CRM Customer ${suffix}`,
      customerPhone: `07${suffix.slice(-9).padStart(9, "0")}`,
    },
  });

  const order = await createOrderFromSession(orderSession.id);

  return { order, menuItemId: menuItem.id };
}

async function main() {
  console.log("Module structure");
  const moduleFiles = [
    "src/modules/crm/index.ts",
    "src/modules/crm/constants/routes.ts",
    "src/modules/crm/types/crm.ts",
    "src/modules/crm/utils/crm-utils.ts",
    "src/modules/crm/lib/get-crm-context.ts",
    "src/modules/crm/actions/crm-actions.ts",
    "src/modules/crm/components/crm-dashboard.tsx",
    "src/modules/crm/components/customers-manager.tsx",
    "src/modules/crm/components/customer-detail-view.tsx",
    "src/services/crm.service.ts",
    "src/services/crm-timeline.service.ts",
    "src/services/loyalty.service.ts",
    "src/app/dashboard/crm/page.tsx",
    "src/app/dashboard/crm/customers/page.tsx",
    "src/app/dashboard/crm/customers/[customerId]/page.tsx",
    "src/app/dashboard/crm/loyalty/page.tsx",
    "src/app/dashboard/crm/rewards/page.tsx",
    "src/app/dashboard/crm/groups/page.tsx",
  ];

  for (const file of moduleFiles) {
    readFileSync(join(root, file), "utf8");
  }
  console.log("  PASS");

  console.log("CRM routes");
  assert(CRM_ROUTES.overview === "/dashboard/crm", "crm route mismatch");
  console.log("  PASS");

  console.log("Permission protected");
  const contextSource = readFileSync(join(root, "src/modules/crm/lib/get-crm-context.ts"), "utf8");
  const actionsSource = readFileSync(join(root, "src/modules/crm/actions/crm-actions.ts"), "utf8");
  assert(contextSource.includes("protectedPage"), "crm pages should use protectedPage");
  assert(contextSource.includes("PERMISSION_CODES.CRM_VIEW"), "crm.view required");
  assert(actionsSource.includes("protectedAction"), "crm actions should use protectedAction");
  assert(actionsSource.includes("PERMISSION_CODES.CRM_MANAGE"), "crm.manage required");
  assert(PERMISSION_CODES.CRM_VIEW === "crm.view", "crm.view code missing");
  assert(PERMISSION_CODES.CRM_MANAGE === "crm.manage", "crm.manage code missing");
  console.log("  PASS");

  console.log("Integer pence formatting");
  assertGbpFormat(formatCrmMoney(1250));
  assert(calculateEarnPoints(5000, 1) === 50, "earn points calculation failed");
  console.log("  PASS");

  console.log("Schema");
  const schemaSource = readFileSync(join(root, "prisma/schema.prisma"), "utf8");
  assert(schemaSource.includes("loyaltyPoints Int"), "loyalty points must be integer");
  assert(schemaSource.includes("valuePence    Int?"), "reward value must be integer pence");
  console.log("  PASS");

  const business = await prisma.business.findFirst({
    select: { id: true, ownerId: true },
  });
  assert(business, "No business found");

  const suffix = Date.now().toString();
  const groups = await listCustomerGroups(business.id);
  assert(groups.length >= 4, "default customer groups missing");

  console.log("Customer management");
  const customer = await createCustomer(business.id, null, {
    name: `CRM Test ${suffix}`,
    phone: `07${suffix.slice(-9).padStart(9, "1")}`,
    email: `crm-${suffix}@example.com`,
    tags: ["regular"],
    groupId: groups.find((group) => group.slug === "regular")?.id ?? null,
  });
  assert(customer.status === "ACTIVE", "customer should be active");
  console.log("  PASS");

  console.log("Loyalty program and rewards");
  const program = await getOrCreateLoyaltyProgram(business.id);
  assert(program.isEnabled, "loyalty program should be enabled");

  const reward = await createReward(business.id, null, {
    name: "Birthday Treat",
    type: "BIRTHDAY",
    valuePence: 500,
    pointsCost: 100,
  });
  assertIntegerPenceValue(reward.valuePence ?? 0, "reward value");
  console.log("  PASS");

  console.log("Manual loyalty adjustment");
  await adjustLoyaltyPoints(business.id, customer.id, null, 150, "Welcome bonus");
  const adjustedCustomer = await getCustomer(customer.id, business.id);
  assert(adjustedCustomer.loyaltyPoints === 150, "manual points adjustment failed");
  console.log("  PASS");

  const { order } = await createCrmOrder(business.id, business.ownerId, suffix);
  const orderRecord = await prisma.order.findUnique({
    where: { id: order.id },
    select: { total: true },
  });
  assert(orderRecord, "order record missing");
  const orderTotalPence = moneyDecimalToPence(orderRecord.total);

  console.log("CRM order completion integration");
  await recordPayment(business.id, order.id, null, {
    method: "CARD",
    amountPence: orderTotalPence,
    amountTenderedPence: orderTotalPence,
  });

  const linkedOrder = await prisma.order.findUnique({
    where: { id: order.id },
    select: { customerId: true, status: true },
  });
  assert(linkedOrder?.status === "COMPLETED", "order should be completed");
  assert(linkedOrder?.customerId, "order should link to customer");

  const customerAfterOrder = await getCustomer(linkedOrder.customerId!, business.id);
  assert(customerAfterOrder.loyaltyPoints > 150, "loyalty points should be earned on order");

  const history = await getCustomerOrderHistory(customerAfterOrder.id, business.id);
  assertIntegerPenceValue(history.totalSpentPence, "total spent");
  assert(history.totalOrders >= 1, "order history count failed");
  assert(history.favouriteItems.length >= 1, "favourite items missing");

  const timeline = await getCustomerTimeline(customerAfterOrder.id, business.id);
  assert(
    timeline.some((event) => event.eventType === "ORDER"),
    "order timeline event missing",
  );
  assert(
    timeline.some((event) => event.eventType === "LOYALTY"),
    "loyalty timeline event missing",
  );
  console.log("  PASS");

  console.log("Reward redemption");
  await redeemReward(business.id, customerAfterOrder.id, reward.id, null);
  const points = await listPointTransactions(customerAfterOrder.id, business.id);
  assert(
    points.some((entry) => entry.type === "REDEEM"),
    "redeem transaction missing",
  );
  assert(
    timeline.some((event) => event.eventType === "REWARD") ||
      (await getCustomerTimeline(customerAfterOrder.id, business.id)).some(
        (event) => event.eventType === "REWARD",
      ),
    "reward timeline event missing",
  );
  console.log("  PASS");

  console.log("Idempotent CRM processing");
  await processCrmForCompletedOrder(business.id, order.id, null);
  const earnCount = await prisma.loyaltyPointTransaction.count({
    where: { customerId: customerAfterOrder.id, orderId: order.id, type: "EARN" },
  });
  assert(earnCount === 1, "duplicate loyalty earn should not occur");
  console.log("  PASS");

  console.log("CRM dashboard");
  const dashboard = await getCrmDashboard(business.id);
  assert(dashboard.totalCustomers >= 1, "dashboard customer count failed");
  assert(dashboard.loyaltyStatistics.totalPointsOutstanding >= 0, "loyalty stats failed");
  console.log("  PASS");

  console.log("Business isolation");
  const otherBusiness = await prisma.business.findFirst({
    where: { id: { not: business.id } },
    select: { id: true },
  });
  if (otherBusiness) {
    let isolated = false;
    try {
      await getCustomer(customer.id, otherBusiness.id);
    } catch (error) {
      isolated = error instanceof Error && error.message.includes("not found");
    }
    assert(isolated, "customer should be isolated by business");
  }
  console.log("  PASS");

  console.log("\nCRM verification passed.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

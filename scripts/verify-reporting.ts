import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "@prisma/client";

import { PERMISSION_CODES } from "../src/modules/authorization/constants/permissions";
import { formatReportingMoney } from "../src/modules/reporting/utils/reporting-utils";
import { REPORTING_ROUTES } from "../src/modules/reporting/constants/routes";
import { createOmsOrderFromQrFlow } from "./lib/verify-oms-order";
import { recordPaymentForBusiness } from "../src/modules/payments/services/payment-business-bridge.service";
import {
  getCustomerAnalytics,
  getFinancialReport,
  getInventoryAnalytics,
  getOrderAnalytics,
  getProductAnalytics,
  getReportingDashboard,
  getSalesDashboard,
  getStaffAnalytics,
} from "../src/services/reporting.service";
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

async function createReportingOrder(businessId: string, ownerId: string, suffix: string) {
  const { order, branchId, menuItem, orderSession } = await createOmsOrderFromQrFlow(
    prisma,
    businessId,
    ownerId,
    suffix,
    { slugPrefix: "report", price: 18.5 },
  );

  await prisma.orderSession.update({
    where: { id: orderSession.id },
    data: {
      customerName: `Reporting Customer ${suffix}`,
      customerPhone: `07${suffix.slice(-9).padStart(9, "0")}`,
    },
  });

  const orderRecord = await prisma.restaurantOrder.findUniqueOrThrow({
    where: { id: order.id },
    select: { totalAmount: true },
  });
  const orderTotalPence = moneyDecimalToPence(orderRecord.totalAmount);
  await recordPaymentForBusiness(businessId, order.id, {
    method: "CASH",
    amountPence: orderTotalPence,
    amountTenderedPence: orderTotalPence,
  }, branchId);

  return { order, menuItemId: menuItem.id };
}

async function main() {
  console.log("Module structure");
  const moduleFiles = [
    "src/modules/reporting/index.ts",
    "src/modules/reporting/constants/routes.ts",
    "src/modules/reporting/utils/reporting-utils.ts",
    "src/modules/reporting/utils/reporting-audit.ts",
    "src/modules/reporting/utils/export/report-export.ts",
    "src/modules/reporting/lib/get-reporting-context.ts",
    "src/modules/reporting/actions/reporting-actions.ts",
    "src/modules/reporting/components/reporting-dashboard.tsx",
    "src/modules/reporting/components/widgets/kpi-card.tsx",
    "src/modules/reporting/components/widgets/chart-card.tsx",
    "src/modules/reporting/components/widgets/data-table-widget.tsx",
    "src/modules/reporting/components/widgets/trend-chart.tsx",
    "src/services/reporting.service.ts",
    "src/app/dashboard/reporting/page.tsx",
    "src/app/dashboard/reporting/sales/page.tsx",
    "src/app/dashboard/reporting/orders/page.tsx",
    "src/app/dashboard/reporting/products/page.tsx",
    "src/app/dashboard/reporting/customers/page.tsx",
    "src/app/dashboard/reporting/inventory/page.tsx",
    "src/app/dashboard/reporting/staff/page.tsx",
    "src/app/dashboard/reporting/financial/page.tsx",
  ];

  for (const file of moduleFiles) {
    readFileSync(join(root, file), "utf8");
  }
  console.log("  PASS");

  console.log("Reporting routes");
  assert(REPORTING_ROUTES.overview === "/dashboard/reporting", "reporting route mismatch");
  console.log("  PASS");

  console.log("Permission protected");
  const contextSource = readFileSync(
    join(root, "src/modules/reporting/lib/get-reporting-context.ts"),
    "utf8",
  );
  const actionsSource = readFileSync(
    join(root, "src/modules/reporting/actions/reporting-actions.ts"),
    "utf8",
  );
  assert(contextSource.includes("protectedPage"), "reporting pages should use protectedPage");
  assert(contextSource.includes("PERMISSION_CODES.ANALYTICS_VIEW"), "analytics.view required");
  assert(actionsSource.includes("protectedAction"), "reporting actions should use protectedAction");
  assert(actionsSource.includes("PERMISSION_CODES.ANALYTICS_VIEW"), "analytics.view required");
  assert(PERMISSION_CODES.ANALYTICS_VIEW === "analytics.view", "analytics.view code missing");
  console.log("  PASS");

  console.log("Integer pence formatting");
  assertGbpFormat(formatReportingMoney(1850));
  console.log("  PASS");

  console.log("Schema");
  const schemaSource = readFileSync(join(root, "prisma/schema.prisma"), "utf8");
  assert(schemaSource.includes("model ReportingAuditLog"), "ReportingAuditLog model missing");
  assert(schemaSource.includes("reporting_audit_logs"), "reporting audit table missing");
  console.log("  PASS");

  const business = await prisma.business.findFirst({
    select: { id: true, ownerId: true },
  });
  assert(business, "No business found");

  const suffix = Date.now().toString();
  await createReportingOrder(business.id, business.ownerId, suffix);

  console.log("Sales dashboard");
  const sales = await getSalesDashboard(business.id);
  assertIntegerPenceValue(sales.periods.today.netRevenuePence, "today net revenue");
  assertIntegerPenceValue(sales.periods.week.netRevenuePence, "week net revenue");
  assertIntegerPenceValue(sales.grossRevenuePence, "gross revenue");
  assert(sales.totalOrders >= 1, "expected at least one order today");
  console.log("  PASS");

  console.log("Order analytics");
  const orders = await getOrderAnalytics(business.id);
  assert(Array.isArray(orders.ordersByHour), "orders by hour missing");
  assert(orders.ordersByHour.length === 24, "orders by hour should have 24 buckets");
  assert(Array.isArray(orders.ordersByPaymentMethod), "payment method summary missing");
  console.log("  PASS");

  console.log("Product analytics");
  const products = await getProductAnalytics(business.id);
  assert(products.bestSelling.length >= 1, "expected best selling items");
  assertIntegerPenceValue(products.bestSelling[0]!.revenuePence, "product revenue");
  console.log("  PASS");

  console.log("Customer analytics");
  const customers = await getCustomerAnalytics(business.id);
  assert(customers.retentionRatePercent >= 0 && customers.retentionRatePercent <= 100, "retention");
  console.log("  PASS");

  console.log("Inventory analytics");
  const inventory = await getInventoryAnalytics(business.id);
  assertIntegerPenceValue(inventory.stockValuationPence, "stock valuation");
  console.log("  PASS");

  console.log("Staff analytics");
  const staff = await getStaffAnalytics(business.id);
  assert(Array.isArray(staff), "staff analytics should be array");
  console.log("  PASS");

  console.log("Financial reports");
  const [daily, weekly, monthly] = await Promise.all([
    getFinancialReport(business.id, "daily"),
    getFinancialReport(business.id, "weekly"),
    getFinancialReport(business.id, "monthly"),
  ]);
  assertIntegerPenceValue(daily.netRevenuePence, "daily net revenue");
  assertIntegerPenceValue(weekly.taxPence, "weekly tax");
  assertIntegerPenceValue(monthly.discountPence, "monthly discount");
  assert(Array.isArray(monthly.paymentMethodSummary), "payment method summary missing");
  console.log("  PASS");

  console.log("Reporting dashboard");
  const dashboard = await getReportingDashboard(business.id);
  assert(dashboard.sales.totalOrders >= 1, "dashboard should include orders");
  assert(dashboard.products.bestSelling.length >= 1, "dashboard products missing");
  console.log("  PASS");

  console.log("Business isolation");
  const otherBusiness = await prisma.business.findFirst({
    where: { id: { not: business.id } },
    select: { id: true },
  });

  if (otherBusiness) {
    const isolated = await getSalesDashboard(otherBusiness.id);
    assert(isolated.periods.today.totalOrders === 0, "other business should have no orders today");
  }
  console.log("  PASS");

  console.log("\nReporting verification passed.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

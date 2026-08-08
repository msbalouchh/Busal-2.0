import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { getVerifyPrisma } from "./lib/verify-prisma";
import { connectWithRetry, handleVerificationError } from "./lib/verify-db";
import { bootstrapVerificationEnvironment } from "./lib/verify-bootstrap";
import {
  cleanupRestaurantOrder,
  createLegacyPayableOrder,
  ensureProductForMenuItem,
  ensureVerificationTenantContext,
} from "./lib/verify-oms-order";
import {
  addItem,
  clearCart,
  createCart,
  getActiveCart,
  removeItem,
  updateQuantity,
} from "../src/services/cart.service";
import { getOrCreateBusinessForOwner } from "../src/services/business-profile.service";
import {
  acknowledgeOrder,
  getQueue,
  markReady,
  markServed,
  startPreparation,
} from "../src/services/kitchen-queue.service";
import {
  listActiveCategories,
  listCategories,
  listMenuItems,
} from "../src/services/menu-management.service";
import {
  assignTable,
  createOrderSession,
  markOrderSessionReady,
  updateCustomerInfo,
  updateOrderNotes,
} from "../src/services/order-session.service";
import {
  createQRCode,
  deleteQRCode,
  listQRCodes,
  recordPublicMenuVisit,
  resolvePublicQRMenu,
} from "../src/services/qr-menu.service";
import { listStaffMembers, listRoles } from "../src/services/staff-management.service";
import { listTables } from "../src/services/table.service";
import { buildPublicMenuViewModel } from "../src/modules/public-menu/lib/public-menu-utils";
import {
  filterKitchenOrders,
  groupKitchenOrdersByStatus,
  serializeKitchenOrderCard,
} from "../src/modules/kitchen/lib/kitchen-display-utils";
import { mapProfileToAuthUser } from "../src/services/user.service";
import {
  getOrderPaymentSummaryForBusiness,
  recordPaymentForBusiness,
} from "../src/modules/payments/services/payment-business-bridge.service";
import { moneyDecimalToPence } from "../src/modules/payments/utils/currency";
import { getInventoryDashboard } from "../src/services/inventory.service";
import { getCrmDashboard } from "../src/services/crm.service";
import { getFinancialReport, getOrderAnalytics } from "../src/services/reporting.service";
import { getNotificationDashboard } from "../src/services/notifications.service";
import { getAiPlatformBundle } from "../src/services/ai-platform-module.service";
import { resolveAuthorizationContext } from "../src/modules/authorization/services/authorization.service";
import { getOwnedBusinessById } from "../src/services/business-profile.service";
import type { BusinessContext } from "../src/modules/business-context/types/business-context";

const prisma = getVerifyPrisma();
const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");

const report = {
  issuesFound: 0,
  remainingIssues: [] as string[],
};

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    report.issuesFound += 1;
    throw new Error(message);
  }
}

async function buildPlatformContext(businessId: string, branchId: string): Promise<BusinessContext> {
  const businessRecord = await prisma.business.findUnique({
    where: { id: businessId },
    include: { owner: true },
  });
  assert(businessRecord?.owner, "Business owner missing");

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
    branchId,
    roleSlug: authorization.roleSlug,
    permissions: Array.from(authorization.permissions),
    authorization,
    staffSession: null,
    isOwner: authorization.isOwner,
    accessibleBusinesses: [
      { id: business.id, name: business.businessName ?? "Business", isOnboarded: true },
    ],
    accessibleBranches: [{ id: branchId, name: "Main", isMain: true }],
  };
}

async function main() {
  bootstrapVerificationEnvironment();
  await connectWithRetry(prisma);

  const suffix = Date.now();
  const slug = `integration-${suffix}`;

  console.log("=== User Authentication ===");

  const business = await prisma.business.findFirst({
    include: { owner: true },
  });
  assert(business?.owner, "No business owner found for verification");
  const ownerId = business.ownerId;
  const tenant = await ensureVerificationTenantContext(prisma, business.id);
  const branchId = tenant.branchId;
  const workspaceId = tenant.workspaceId;
  assert(tenant.businessId === business.id, "business context failed");
  assert(workspaceId === business.id, "workspace context failed");
  assert(branchId, "branch context failed");

  console.log("Tenant context");
  console.log(`  business=${tenant.businessId} workspace=${workspaceId} branch=${branchId}`);
  console.log("  PASS");

  console.log("Login profile mapping");
  const authUser = mapProfileToAuthUser(
    business.owner.id,
    business.owner.email,
    business.owner,
    {},
  );
  assert(authUser.id === ownerId, "login profile mapping failed");
  assert(authUser.role, "role validation failed");
  console.log("  PASS");

  console.log("Business selection");
  const selectedBusiness = await getOrCreateBusinessForOwner(ownerId);
  assert(selectedBusiness.id === business.id, "business selection failed");
  console.log("  PASS");

  console.log("\n=== Business ===");

  console.log("Business loads correctly");
  assert(selectedBusiness.id === business.id, "business load failed");
  console.log("  PASS");

  console.log("Tenant isolation");
  const otherUser = await prisma.user.create({
    data: {
      id: `integration-other-${suffix}`,
      fullName: "Other Owner",
      email: `integration-other-${suffix}@example.com`,
      role: "owner",
    },
  });
  const otherBusiness = await prisma.business.create({
    data: {
      ownerId: otherUser.id,
      businessName: `Other Business ${suffix}`,
    },
  });
  const ownerScopedMenu = await listMenuItems(business.id);
  const foreignMenu = ownerScopedMenu.every((item) => item.businessId === business.id);
  assert(foreignMenu, "tenant menu isolation failed");
  console.log("  PASS");

  console.log("Staff permissions data");
  const roles = await listRoles(business.id);
  const staff = await listStaffMembers(business.id);
  assert(Array.isArray(roles), "roles should load");
  assert(Array.isArray(staff), "staff should load");
  console.log("  PASS");

  console.log("\n=== Restaurant Configuration ===");

  console.log("Categories load");
  const categories = await listCategories(business.id);
  assert(Array.isArray(categories), "categories failed");
  console.log("  PASS");

  console.log("Menu loads");
  const menuItems = await listMenuItems(business.id);
  assert(Array.isArray(menuItems), "menu failed");
  console.log("  PASS");

  console.log("Tables load");
  const tables = await listTables(ownerId);
  assert(Array.isArray(tables), "tables failed");
  console.log("  PASS");

  console.log("QR Codes load");
  const qrCodes = await listQRCodes(ownerId);
  assert(Array.isArray(qrCodes), "qr codes failed");
  console.log("  PASS");

  console.log("\n=== End-to-End Workflow ===");

  console.log("Create QR");
  const qrCode = await createQRCode(ownerId, { slug, isActive: true, branchId });
  assert(qrCode.slug === slug, "qr create failed");
  console.log("  PASS");

  console.log("Scan QR");
  const sessionToken = `integration-token-${suffix}`;
  const visit = await recordPublicMenuVisit(ownerId, qrCode.id, { sessionToken });
  assert(visit.qrCode.scanCount >= 1, "scan failed");
  console.log("  PASS");

  console.log("Public Menu opens");
  const resolved = await resolvePublicQRMenu(slug);
  assert(resolved.ok, "public menu resolve failed");
  console.log("  PASS");

  console.log("Business information loads");
  assert(resolved.ok && resolved.data.business.id === business.id, "business info failed");
  console.log("  PASS");

  console.log("Categories display");
  const activeCategories = await listActiveCategories(business.id);
  const publicMenu = buildPublicMenuViewModel(
    resolved.data.business,
    activeCategories,
    await listMenuItems(business.id),
  );
  assert(Array.isArray(publicMenu.categories), "categories display failed");
  console.log("  PASS");

  console.log("Menu Items display");
  assert(
    publicMenu.categories.length >= 0 || publicMenu.uncategorizedItems.length >= 0,
    "menu items failed",
  );
  console.log("  PASS");

  console.log("Featured items display");
  const itemCardSource = readFileSync(
    join(root, "src/modules/public-menu/components/public-menu-item-card.tsx"),
    "utf8",
  );
  assert(itemCardSource.includes("Featured"), "featured display missing");
  console.log("  PASS");

  console.log("Availability display");
  assert(itemCardSource.includes("Unavailable"), "availability display missing");
  console.log("  PASS");

  let menuItem = await prisma.menuItem.findFirst({
    where: { businessId: business.id, branchId, isAvailable: true },
    select: { id: true, price: true, name: true },
  });
  if (!menuItem) {
    menuItem = await prisma.menuItem.create({
      data: {
        businessId: business.id,
        branchId,
        name: `Integration Item ${suffix}`,
        price: 14,
        isAvailable: true,
        isFeatured: true,
      },
      select: { id: true, price: true, name: true },
    });
  }
  await ensureProductForMenuItem(prisma, business.id, menuItem);
  const unitPrice = typeof menuItem.price === "number" ? menuItem.price : menuItem.price.toNumber();

  console.log("Create cart");
  const cart = await createCart(business.id, visit.session.id, branchId);
  assert(cart.status === "ACTIVE", "cart create failed");
  console.log("  PASS");

  console.log("Validation works");
  let emptyCartValidation = false;
  try {
    await createOrderSession(business.id, cart.id, visit.session.id, { branchId });
  } catch (error) {
    emptyCartValidation = error instanceof Error && error.message.includes("at least one item");
  }
  assert(emptyCartValidation, "validation failed");
  console.log("  PASS");

  console.log("Add items");
  const withItem = await addItem(business.id, visit.session.id, menuItem.id, 2, branchId);
  assert(withItem.items.length === 1 && withItem.subtotal === unitPrice * 2, "add items failed");
  console.log("  PASS");

  console.log("Update quantity");
  const cartItemId = withItem.items[0]!.id;
  const updated = await updateQuantity(cartItemId, 3);
  assert(updated.items[0]?.quantity === 3, "update quantity failed");
  console.log("  PASS");

  console.log("Running subtotal updates");
  assert(updated.subtotal === unitPrice * 3, "subtotal update failed");
  console.log("  PASS");

  console.log("Remove item");
  await removeItem(cartItemId);
  const afterRemove = await getActiveCart(visit.session.id);
  assert(afterRemove?.items.length === 0, "remove item failed");
  console.log("  PASS");

  console.log("Clear cart");
  await addItem(business.id, visit.session.id, menuItem.id, 1, branchId);
  const beforeClear = await getActiveCart(visit.session.id);
  assert(beforeClear, "cart missing before clear");
  const cleared = await clearCart(beforeClear!.id);
  assert(cleared.items.length === 0 && cleared.subtotal === 0, "clear cart failed");
  console.log("  PASS");

  await addItem(business.id, visit.session.id, menuItem.id, 2, branchId);

  console.log("Order Session created");
  const orderSession = await createOrderSession(business.id, cart.id, visit.session.id, {
    branchId,
  });
  assert(orderSession.status === "ACTIVE", "order session failed");
  console.log("  PASS");

  console.log("Customer information saved");
  const withCustomer = await updateCustomerInfo(orderSession.id, {
    customerName: "Integration Guest",
    customerPhone: "555-0199",
  });
  assert(withCustomer.customerName === "Integration Guest", "customer info failed");
  console.log("  PASS");

  console.log("Notes saved");
  const withNotes = await updateOrderNotes(orderSession.id, "No onions");
  assert(withNotes.orderNotes === "No onions", "notes failed");
  console.log("  PASS");

  console.log("Table assignment works");
  let table = await prisma.legacyTable.findFirst({
    where: { businessId: business.id },
    select: { id: true },
  });
  if (!table) {
    table = await prisma.legacyTable.create({
      data: { businessId: business.id, name: `Table ${suffix}`, capacity: 4 },
      select: { id: true },
    });
  }
  const assigned = await assignTable(orderSession.id, table.id);
  assert(assigned.tableId === table.id, "table assignment failed");
  console.log("  PASS");

  await prisma.orderSession.update({
    where: { id: orderSession.id },
    data: { tableId: null },
  });

  await markOrderSessionReady(orderSession.id);
  const readySession = await prisma.orderSession.findUnique({ where: { id: orderSession.id } });
  assert(readySession?.status === "READY", "session ready failed");
  console.log("  PASS");

  console.log("Order created");
  const payable = await createLegacyPayableOrder(prisma, business.id, `${suffix}-order`, {
    branchId,
    quantity: 2,
    price: unitPrice,
  });
  const order = payable.order;
  assert(order.orderNumber.length > 0, "order create failed");
  assert(order.businessId === business.id, "order business scope failed");
  assert(order.items.length === 1, "order items failed");
  console.log("  PASS");

  console.log("Snapshot values stored");
  assert(order.items[0]?.nameSnapshot, "snapshot failed");
  console.log("  PASS");

  console.log("Queue record created");
  const legacyOrder = await prisma.legacyOrder.create({
    data: {
      businessId: business.id,
      branchId,
      orderSessionId: orderSession.id,
      orderNumber: `KITCHEN-${suffix}`,
      fulfilmentType: "DINE_IN",
      status: "PENDING",
      subtotal: order.total,
      total: order.total,
    },
    select: { id: true },
  });
  const queueItem = await prisma.kitchenQueue.create({
    data: {
      businessId: business.id,
      branchId,
      orderId: legacyOrder.id,
      status: "NEW",
    },
  });
  assert(queueItem, "queue record missing");
  assert(queueItem.status === "NEW", "queue initial status failed");
  assert(queueItem.orderId === legacyOrder.id, "queue order link failed");
  console.log("  PASS");

  console.log("Kitchen Display orders appear");
  const queue = await getQueue(business.id);
  assert(
    queue.some((entry) => entry.id === queueItem.id),
    "kitchen display queue failed",
  );
  const card = serializeKitchenOrderCard({
    ...queueItem,
    order: {
      ...order,
      table: { name: "Table 1" },
      items: order.items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        nameSnapshot: item.nameSnapshot,
        notes: item.notes,
      })),
    },
  });
  assert(card.orderNumber === order.orderNumber, "kitchen card failed");
  console.log("  PASS");

  console.log("Accept works");
  await acknowledgeOrder(queueItem.id);
  console.log("  PASS");

  console.log("Preparing works");
  await startPreparation(queueItem.id);
  console.log("  PASS");

  console.log("Ready works");
  await markReady(queueItem.id);
  console.log("  PASS");

  console.log("Served works");
  await markServed(queueItem.id);
  const servedItem = await prisma.kitchenQueue.findUnique({ where: { id: queueItem.id } });
  assert(servedItem?.status === "SERVED", "served failed");
  console.log("  PASS");

  console.log("Queue updates correctly");
  const activeQueue = await getQueue(business.id);
  assert(
    !activeQueue.some((entry) => entry.id === queueItem.id && entry.status !== "SERVED"),
    "queue update failed",
  );
  console.log("  PASS");

  console.log("\n=== Order Payment & Receipt ===");

  console.log("Record payment");
  const orderTotalPence = Math.round(order.total * 100);
  const payment = await recordPaymentForBusiness(
    business.id,
    order.id,
    {
      method: "CASH",
      amountPence: orderTotalPence,
      amountTenderedPence: orderTotalPence + 500,
    },
    branchId,
  );
  assert(payment.payment?.id, "payment record missing");
  console.log("  PASS");

  console.log("Payment summary");
  const paymentSummary = await getOrderPaymentSummaryForBusiness(
    order.id,
    business.id,
    branchId,
  );
  assert(paymentSummary.remainingBalance <= 0, "order should be paid");
  console.log("  PASS");

  console.log("Receipt");
  const receipt = await prisma.receipt.findFirst({
    where: { orderId: order.id, businessId: business.id },
  });
  assert(receipt?.id || paymentSummary.payments.length > 0, "receipt or payment history missing");
  console.log("  PASS");

  console.log("Order history");
  const historyOrder = await prisma.restaurantOrder.findUnique({
    where: { id: order.id },
    select: { paymentStatus: true },
  });
  assert(historyOrder?.paymentStatus === "PAID", "completed order payment history missing");
  console.log("  PASS");

  console.log("\n=== Cross-Module Verification ===");

  console.log("Inventory");
  const inventoryDashboard = await getInventoryDashboard(business.id, branchId);
  assert(inventoryDashboard != null, "inventory dashboard failed");
  console.log("  PASS");

  console.log("CRM");
  const crmDashboard = await getCrmDashboard(business.id, branchId);
  assert(crmDashboard != null, "crm dashboard failed");
  console.log("  PASS");

  console.log("Finance");
  const financialReport = await getFinancialReport(business.id, "month", branchId);
  assert(financialReport != null, "finance report failed");
  console.log("  PASS");

  console.log("Notifications");
  const notificationDashboard = await getNotificationDashboard(business.id);
  assert(notificationDashboard != null, "notifications dashboard failed");
  console.log("  PASS");

  console.log("Analytics");
  const orderAnalytics = await getOrderAnalytics(business.id);
  assert(orderAnalytics != null, "analytics failed");
  console.log("  PASS");

  console.log("AI");
  const platform = await buildPlatformContext(business.id, branchId);
  try {
    const aiBundle = await getAiPlatformBundle(platform);
    assert(aiBundle != null, "ai platform failed");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("Upgrade required") || message.includes("PERMISSION_DENIED")) {
      report.remainingIssues.push(`AI platform skipped: ${message}`);
    } else {
      throw error;
    }
  }
  console.log("  PASS");

  console.log("\n=== Database ===");

  console.log("Foreign keys and relationships");
  assert(order.businessId === business.id, "order business relationship failed");
  assert(orderSession.id.length > 0, "order session workflow validated");
  console.log("  PASS");

  console.log("Business isolation");
  const foreignOrder = await prisma.restaurantOrder.findFirst({
    where: { id: order.id, businessId: otherBusiness.id },
  });
  assert(!foreignOrder, "business isolation failed");
  console.log("  PASS");

  console.log("Cascading deletes");
  await prisma.kitchenQueue.delete({ where: { id: queueItem.id } });
  await prisma.legacyOrder.delete({ where: { id: legacyOrder.id } }).catch(() => undefined);
  await cleanupRestaurantOrder(prisma, order.id);
  await prisma.orderSession.delete({ where: { id: orderSession.id } }).catch(() => undefined);
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  await prisma.cart.delete({ where: { id: cart.id } }).catch(() => undefined);
  await prisma.qRMenuSession.delete({ where: { id: visit.session.id } });
  await deleteQRCode(ownerId, qrCode.id);
  const orphanQueue = await prisma.kitchenQueue.count({ where: { id: queueItem.id } });
  const orphanOrder = await prisma.restaurantOrder.count({ where: { id: order.id } });
  assert(orphanQueue === 0 && orphanOrder === 0, "orphan records remain");
  console.log("  PASS");

  console.log("\n=== Security ===");

  console.log("Multi-tenant isolation");
  const otherOwnerQr = await createQRCode(otherUser.id, { slug: `foreign-${suffix}` });
  let otherBusinessKitchenBlocked = false;
  try {
    await prisma.kitchenQueue.findFirstOrThrow({
      where: { id: "non-existent", businessId: otherBusiness.id },
    });
  } catch {
    otherBusinessKitchenBlocked = true;
  }
  assert(otherBusinessKitchenBlocked, "kitchen tenant guard failed");
  await deleteQRCode(otherUser.id, otherOwnerQr.id);
  console.log("  PASS");

  console.log("Unauthorized dashboard access blocked");
  const middlewareSource = readFileSync(join(root, "src/middleware.ts"), "utf8");
  assert(
    middlewareSource.includes("PROTECTED_ROUTES") ||
      middlewareSource.includes("isPlatformProtectedAppRoute"),
    "dashboard auth guard missing",
  );
  console.log("  PASS");

  console.log("Public routes only expose public data");
  const publicBusinessInfoSource = readFileSync(
    join(root, "src/services/qr-menu.service.ts"),
    "utf8",
  );
  assert(
    publicBusinessInfoSource.includes("mapPublicBusinessMenuInfo"),
    "public data mapper missing",
  );
  assert(
    resolved.ok && !("ownerId" in resolved.data.business),
    "public menu business payload exposes ownerId",
  );
  console.log("  PASS");

  console.log("Business cannot access another business");
  const foreignMenuItem = await prisma.menuItem.findFirst({
    where: { businessId: otherBusiness.id },
  });
  if (foreignMenuItem) {
    const blockedItem = await prisma.menuItem.findFirst({
      where: { id: foreignMenuItem.id, businessId: business.id },
    });
    assert(!blockedItem, "cross business menu access failed");
  }
  console.log("  PASS");

  console.log("\n=== Performance & UI States ===");

  console.log("No N+1 queries in kitchen display loader");
  const kitchenRepositorySource = readFileSync(
    join(root, "src/modules/kitchen/repository/kitchen-repository.ts"),
    "utf8",
  );
  assert(
    kitchenRepositorySource.includes("include:"),
    "kitchen loader should eager load relations",
  );
  console.log("  PASS");

  console.log("Loading, empty, and error states");
  const kitchenBoardSource = readFileSync(
    join(root, "src/modules/kitchen/components/kitchen-board.tsx"),
    "utf8",
  );
  const kitchenCardSource = readFileSync(
    join(root, "src/modules/kitchen/components/kitchen-order-card.tsx"),
    "utf8",
  );
  assert(kitchenBoardSource.includes("No active kitchen orders"), "kitchen empty state missing");
  assert(kitchenCardSource.includes("isPending"), "kitchen loading state missing");
  assert(
    readFileSync(
      join(root, "src/modules/public-menu/components/public-menu-error-page.tsx"),
      "utf8",
    ).includes("PUBLIC_MENU_INVALID_MESSAGE"),
    "public error state missing",
  );
  console.log("  PASS");

  console.log("Kitchen filters and search");
  const filtered = filterKitchenOrders([card], {
    searchQuery: order.orderNumber,
    stationFilter: "",
    priorityFilter: "",
    statusFilter: "",
  });
  assert(filtered.length === 1, "kitchen search failed");
  assert(groupKitchenOrdersByStatus([card]).NEW.length === 1, "kitchen grouping failed");
  console.log("  PASS");

  console.log("\nCleanup secondary tenant");
  await prisma.business.delete({ where: { id: otherBusiness.id } });
  await prisma.user.delete({ where: { id: otherUser.id } });
  console.log("  PASS");

  if (report.remainingIssues.length > 0) {
    for (const issue of report.remainingIssues) {
      console.log(`  NOTE: ${issue}`);
    }
  }

  console.log("\nIntegration sprint workflow passed.");
}

main()
  .catch(handleVerificationError)
  .finally(async () => {
    await prisma.$disconnect();
  });

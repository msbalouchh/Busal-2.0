import type { PrismaClient } from "@prisma/client";
import { addItem, createCart } from "../../src/services/cart.service";
import { createOrderFromSession } from "../../src/services/order.service";
import { createOrderSession, markOrderSessionReady } from "../../src/services/order-session.service";
import { createQRCode, recordPublicMenuVisit } from "../../src/services/qr-menu.service";

export async function resolveBranchId(prisma: PrismaClient, businessId: string): Promise<string> {
  const branch = await prisma.branch.findFirst({
    where: { businessId, isActive: true },
    orderBy: [{ isMain: "desc" }, { createdAt: "asc" }],
    select: { id: true },
  });

  if (!branch) {
    throw new Error("No branch found for business");
  }

  return branch.id;
}

async function ensureMainBranchForVerification(
  prisma: PrismaClient,
  businessId: string,
): Promise<void> {
  const existing = await prisma.branch.findFirst({
    where: { businessId, isMain: true, isActive: true },
    select: { id: true },
  });

  if (existing) {
    return;
  }

  const fallback = await prisma.branch.findFirst({
    where: { businessId, isActive: true },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });

  if (fallback) {
    await prisma.branch.update({
      where: { id: fallback.id },
      data: { isMain: true },
    });
    return;
  }

  await prisma.branch.create({
    data: {
      businessId,
      name: "Main Branch",
      isMain: true,
      isActive: true,
    },
  });
}

export async function ensureVerificationTenantContext(
  prisma: PrismaClient,
  businessId: string,
): Promise<{ businessId: string; workspaceId: string; branchId: string }> {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { id: true },
  });

  if (!business) {
    throw new Error("Business not found for verification");
  }

  await ensureMainBranchForVerification(prisma, businessId);
  const branchId = await resolveBranchId(prisma, businessId);

  return {
    businessId: business.id,
    workspaceId: business.id,
    branchId,
  };
}

export async function ensureProductForMenuItem(
  prisma: PrismaClient,
  businessId: string,
  menuItem: { id: string; name: string; price: number | { toNumber(): number } },
): Promise<void> {
  const existing = await prisma.product.findFirst({
    where: {
      businessId,
      OR: [{ id: menuItem.id }, { name: menuItem.name, status: "ACTIVE" }],
    },
    select: { id: true },
  });

  if (existing) {
    return;
  }

  let category = await prisma.category.findFirst({
    where: { businessId },
    select: { id: true },
  });

  if (!category) {
    const menu = await prisma.menu.findFirst({
      where: { businessId },
      select: { id: true },
    });
    const menuId =
      menu?.id ??
      (
        await prisma.menu.create({
          data: { businessId, name: "Verify Menu" },
          select: { id: true },
        })
      ).id;

    category = await prisma.category.create({
      data: {
        businessId,
        menuId,
        name: "Verify Category",
        slug: `verify-cat-${Date.now()}`,
      },
      select: { id: true },
    });
  }

  const price =
    typeof menuItem.price === "number" ? menuItem.price : menuItem.price.toNumber();
  const suffix = menuItem.id.slice(0, 8);

  await prisma.product.create({
    data: {
      id: menuItem.id,
      businessId,
      categoryId: category.id,
      sku: `SKU-${suffix}`,
      slug: `product-${suffix}`,
      name: menuItem.name,
      status: "ACTIVE",
      price,
    },
  });
}

export async function createLegacyPayableOrder(
  prisma: PrismaClient,
  businessId: string,
  suffix: string,
  options: { price?: number; quantity?: number; branchId?: string } = {},
) {
  const branchId = options.branchId ?? (await resolveBranchId(prisma, businessId));
  const price = options.price ?? 30;
  const quantity = options.quantity ?? 2;
  const total = price * quantity;

  const menuItem = await prisma.menuItem.create({
    data: {
      businessId,
      branchId,
      name: `Verify Item ${suffix}`,
      price,
      isAvailable: true,
    },
    select: { id: true, name: true, price: true },
  });

  await ensureProductForMenuItem(prisma, businessId, {
    id: menuItem.id,
    name: menuItem.name,
    price,
  });

  const order = await prisma.restaurantOrder.create({
    data: {
      businessId,
      branchId,
      orderNumber: `PAY-${suffix}`,
      orderType: "DINE_IN",
      status: "PENDING",
      paymentStatus: "UNPAID",
      subtotal: total,
      totalAmount: total,
      items: {
        create: [
          {
            productId: menuItem.id,
            productNameSnapshot: menuItem.name,
            quantity,
            unitPrice: price,
            totalAmount: total,
          },
        ],
      },
    },
    include: { items: true },
  });

  return {
    order: {
      id: order.id,
      businessId: order.businessId,
      orderSessionId: order.id,
      orderNumber: order.orderNumber,
      fulfilmentType: "DINE_IN" as const,
      tableId: null,
      customerName: null,
      customerPhone: null,
      notes: null,
      subtotal: Number(order.subtotal),
      discount: Number(order.discountAmount),
      tax: Number(order.taxAmount),
      total: Number(order.totalAmount),
      status: order.status,
      items: order.items.map((item) => ({
        id: item.id,
        menuItemId: menuItem.id,
        quantity: item.quantity,
        nameSnapshot: item.productNameSnapshot,
        unitPrice: Number(item.unitPrice),
        lineTotal: Number(item.totalAmount),
        notes: item.specialInstructions,
      })),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    },
    branchId,
  };
}

export async function createOmsOrderFromQrFlow(
  prisma: PrismaClient,
  businessId: string,
  ownerId: string,
  suffix: string,
  options: { slugPrefix?: string; quantity?: number; price?: number; branchId?: string } = {},
) {
  const branchId = options.branchId ?? (await resolveBranchId(prisma, businessId));
  const slug = `${options.slugPrefix ?? "verify"}-${suffix}`;

  const qrCode = await createQRCode(ownerId, { slug, branchId });
  const visit = await recordPublicMenuVisit(ownerId, qrCode.id, {
    sessionToken: `${slug}-token`,
  });

  const menuItem = await prisma.menuItem.create({
    data: {
      businessId,
      branchId,
      name: `Verify Item ${suffix}`,
      price: options.price ?? 12,
      isAvailable: true,
    },
    select: { id: true, name: true, price: true },
  });

  await ensureProductForMenuItem(prisma, businessId, menuItem);

  const cart = await createCart(businessId, visit.session.id, branchId);
  await addItem(businessId, visit.session.id, menuItem.id, options.quantity ?? 1, branchId);

  const orderSession = await createOrderSession(businessId, cart.id, visit.session.id, {
    branchId,
  });
  await markOrderSessionReady(orderSession.id);

  const order = await createOrderFromSession(orderSession.id, branchId);

  return { order, branchId, menuItem, cart, orderSession, visit, qrCode };
}

export async function cleanupRestaurantOrder(prisma: PrismaClient, orderId: string): Promise<void> {
  const restaurantOrder = await prisma.restaurantOrder.findUnique({
    where: { id: orderId },
    select: { id: true, orderNumber: true, businessId: true },
  });

  if (restaurantOrder) {
    const legacyOrder = await prisma.legacyOrder.findFirst({
      where: {
        businessId: restaurantOrder.businessId,
        orderNumber: restaurantOrder.orderNumber,
      },
      select: { id: true },
    });

    if (legacyOrder) {
      await prisma.kitchenQueue.deleteMany({ where: { orderId: legacyOrder.id } });
      await prisma.legacyOrderItem.deleteMany({ where: { orderId: legacyOrder.id } });
      await prisma.legacyOrder.deleteMany({ where: { id: legacyOrder.id } });
    }
  }

  await prisma.kitchenQueue.deleteMany({ where: { orderId } });
  await prisma.orderStockDeduction.deleteMany({ where: { orderId } });
  await prisma.orderPayment.deleteMany({ where: { orderId } });
  await prisma.restaurantOrderItem.deleteMany({ where: { orderId } });
  await prisma.restaurantOrder.deleteMany({ where: { id: orderId } });
}

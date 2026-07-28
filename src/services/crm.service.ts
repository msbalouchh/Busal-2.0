import "server-only";

import { type CustomerStatus, type CustomerTimelineEventType, type Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { branchFilter } from "@/modules/business-context/utils/branch-scope";
import { DEFAULT_CUSTOMER_GROUPS } from "@/modules/crm/constants/routes";
import { logCrmAudit } from "@/modules/crm/utils/crm-audit";
import { moneyDecimalToPence } from "@/modules/payments/utils/currency";
import { recordTimelineEvent } from "@/services/crm-timeline.service";
import { earnPointsForOrder } from "@/services/loyalty.service";

export interface CustomerData {
  id: string;
  businessId: string;
  groupId: string | null;
  groupName: string | null;
  name: string;
  phone: string | null;
  email: string | null;
  dateOfBirth: Date | null;
  address: string | null;
  notes: string | null;
  tags: string[];
  status: CustomerStatus;
  loyaltyPoints: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerInput {
  name: string;
  phone?: string | null;
  email?: string | null;
  dateOfBirth?: Date | null;
  address?: string | null;
  notes?: string | null;
  tags?: string[];
  groupId?: string | null;
  status?: CustomerStatus;
}

export interface CustomerOrderHistory {
  totalOrders: number;
  totalSpentPence: number;
  averageOrderValuePence: number;
  lastOrderAt: string | null;
  favouriteItems: Array<{ name: string; quantity: number }>;
}

export interface CustomerNoteData {
  id: string;
  content: string;
  authorName: string | null;
  createdAt: Date;
}

export interface CustomerTimelineEventData {
  id: string;
  eventType: CustomerTimelineEventType;
  title: string;
  description: string | null;
  createdAt: Date;
}

const customerSelect = {
  id: true,
  businessId: true,
  groupId: true,
  name: true,
  phone: true,
  email: true,
  dateOfBirth: true,
  address: true,
  notes: true,
  tags: true,
  status: true,
  loyaltyPoints: true,
  createdAt: true,
  updatedAt: true,
  group: { select: { name: true } },
} satisfies Prisma.CustomerSelect;

type CustomerRecord = Prisma.CustomerGetPayload<{ select: typeof customerSelect }>;

function mapCustomer(customer: CustomerRecord): CustomerData {
  return {
    id: customer.id,
    businessId: customer.businessId,
    groupId: customer.groupId,
    groupName: customer.group?.name ?? null,
    name: customer.name,
    phone: customer.phone,
    email: customer.email,
    dateOfBirth: customer.dateOfBirth,
    address: customer.address,
    notes: customer.notes,
    tags: customer.tags,
    status: customer.status,
    loyaltyPoints: customer.loyaltyPoints,
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt,
  };
}

export async function ensureDefaultCustomerGroups(businessId: string): Promise<void> {
  for (const [index, group] of DEFAULT_CUSTOMER_GROUPS.entries()) {
    await prisma.customerGroup.upsert({
      where: { businessId_slug: { businessId, slug: group.slug } },
      create: {
        businessId,
        name: group.name,
        slug: group.slug,
        sortOrder: index,
        isSystem: true,
      },
      update: {},
    });
  }
}

export async function listCustomerGroups(businessId: string) {
  await ensureDefaultCustomerGroups(businessId);

  return prisma.customerGroup.findMany({
    where: { businessId },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}

export async function listCustomers(businessId: string): Promise<CustomerData[]> {
  const customers = await prisma.customer.findMany({
    where: { businessId, deletedAt: null },
    select: customerSelect,
    orderBy: [{ name: "asc" }],
  });

  return customers.map(mapCustomer);
}

export async function getCustomer(customerId: string, businessId: string): Promise<CustomerData> {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, businessId, deletedAt: null },
    select: customerSelect,
  });

  if (!customer) {
    throw new Error("Customer not found");
  }

  return mapCustomer(customer);
}

export async function createCustomer(
  businessId: string,
  staffId: string | null,
  input: CustomerInput,
): Promise<CustomerData> {
  const customer = await prisma.customer.create({
    data: {
      businessId,
      groupId: input.groupId ?? null,
      name: input.name.trim(),
      phone: input.phone?.trim() || null,
      email: input.email?.trim() || null,
      dateOfBirth: input.dateOfBirth ?? null,
      address: input.address?.trim() || null,
      notes: input.notes?.trim() || null,
      tags: input.tags ?? [],
      status: input.status ?? "ACTIVE",
    },
    select: customerSelect,
  });

  await recordTimelineEvent(businessId, customer.id, {
    staffId,
    eventType: "PROFILE",
    title: "Customer created",
    description: `${customer.name} profile created`,
  });

  await logCrmAudit(businessId, {
    staffId,
    entityType: "customer",
    entityId: customer.id,
    action: "CREATED",
  });

  return mapCustomer(customer);
}

export async function updateCustomer(
  customerId: string,
  businessId: string,
  staffId: string | null,
  input: CustomerInput,
): Promise<CustomerData> {
  const existing = await prisma.customer.findFirst({
    where: { id: customerId, businessId, deletedAt: null },
    select: { id: true },
  });

  if (!existing) {
    throw new Error("Customer not found");
  }

  const customer = await prisma.customer.update({
    where: { id: customerId },
    data: {
      groupId: input.groupId ?? null,
      name: input.name.trim(),
      phone: input.phone?.trim() || null,
      email: input.email?.trim() || null,
      dateOfBirth: input.dateOfBirth ?? null,
      address: input.address?.trim() || null,
      notes: input.notes?.trim() || null,
      tags: input.tags ?? [],
      status: input.status ?? "ACTIVE",
    },
    select: customerSelect,
  });

  await recordTimelineEvent(businessId, customer.id, {
    staffId,
    eventType: "PROFILE",
    title: "Profile updated",
    description: "Customer profile details were updated",
  });

  await logCrmAudit(businessId, {
    staffId,
    entityType: "customer",
    entityId: customer.id,
    action: "UPDATED",
  });

  return mapCustomer(customer);
}

export async function deactivateCustomer(
  customerId: string,
  businessId: string,
  staffId: string | null,
): Promise<void> {
  const result = await prisma.customer.updateMany({
    where: { id: customerId, businessId, deletedAt: null },
    data: { status: "INACTIVE", deletedAt: new Date() },
  });

  if (result.count === 0) {
    throw new Error("Customer not found");
  }

  await logCrmAudit(businessId, {
    staffId,
    entityType: "customer",
    entityId: customerId,
    action: "DEACTIVATED",
  });
}

export async function addCustomerNote(
  customerId: string,
  businessId: string,
  staffId: string | null,
  content: string,
): Promise<CustomerNoteData> {
  await getCustomer(customerId, businessId);

  const note = await prisma.customerNote.create({
    data: {
      customerId,
      staffId,
      content: content.trim(),
    },
    include: {
      staff: { select: { firstName: true, lastName: true } },
    },
  });

  await recordTimelineEvent(businessId, customerId, {
    staffId,
    eventType: "NOTE",
    title: "Internal note added",
    description: content.trim(),
  });

  return {
    id: note.id,
    content: note.content,
    authorName: note.staff ? `${note.staff.firstName} ${note.staff.lastName}`.trim() : null,
    createdAt: note.createdAt,
  };
}

export async function listCustomerNotes(
  customerId: string,
  businessId: string,
): Promise<CustomerNoteData[]> {
  await getCustomer(customerId, businessId);

  const notes = await prisma.customerNote.findMany({
    where: { customerId },
    orderBy: [{ createdAt: "desc" }],
    include: {
      staff: { select: { firstName: true, lastName: true } },
    },
  });

  return notes.map((note) => ({
    id: note.id,
    content: note.content,
    authorName: note.staff ? `${note.staff.firstName} ${note.staff.lastName}`.trim() : null,
    createdAt: note.createdAt,
  }));
}

export async function getCustomerTimeline(
  customerId: string,
  businessId: string,
): Promise<CustomerTimelineEventData[]> {
  await getCustomer(customerId, businessId);

  const events = await prisma.customerTimelineEvent.findMany({
    where: { customerId, businessId },
    orderBy: [{ createdAt: "desc" }],
    take: 50,
  });

  return events.map((event) => ({
    id: event.id,
    eventType: event.eventType,
    title: event.title,
    description: event.description,
    createdAt: event.createdAt,
  }));
}

export async function getCustomerOrderHistory(
  customerId: string,
  businessId: string,
  branchId: string | null = null,
): Promise<CustomerOrderHistory> {
  await getCustomer(customerId, businessId);

  const orders = await prisma.order.findMany({
    where: { customerId, businessId, ...branchFilter(branchId), status: "COMPLETED" },
    include: {
      items: { select: { nameSnapshot: true, quantity: true } },
    },
    orderBy: [{ createdAt: "desc" }],
  });

  const totalSpentPence = orders.reduce((sum, order) => sum + moneyDecimalToPence(order.total), 0);
  const totalOrders = orders.length;
  const averageOrderValuePence = totalOrders > 0 ? Math.trunc(totalSpentPence / totalOrders) : 0;

  const itemCounts = new Map<string, number>();
  for (const order of orders) {
    for (const item of order.items) {
      itemCounts.set(item.nameSnapshot, (itemCounts.get(item.nameSnapshot) ?? 0) + item.quantity);
    }
  }

  const favouriteItems = [...itemCounts.entries()]
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  return {
    totalOrders,
    totalSpentPence,
    averageOrderValuePence,
    lastOrderAt: orders[0]?.createdAt.toISOString() ?? null,
    favouriteItems,
  };
}

export async function getCrmDashboard(businessId: string, branchId: string | null = null) {
  const customers = await prisma.customer.findMany({
    where: { businessId, deletedAt: null },
    select: {
      id: true,
      name: true,
      loyaltyPoints: true,
      createdAt: true,
      group: { select: { slug: true, name: true } },
      orders: {
        where: { status: "COMPLETED", ...branchFilter(branchId) },
        select: { total: true },
      },
    },
  });

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const newCustomers = customers.filter((customer) => customer.createdAt >= thirtyDaysAgo).length;
  const returningCustomers = customers.filter((customer) => customer.orders.length > 1).length;
  const vipCustomers = customers.filter((customer) => customer.group?.slug === "vip").length;

  const topSpenders = customers
    .map((customer) => ({
      id: customer.id,
      name: customer.name,
      totalSpentPence: customer.orders.reduce(
        (sum, order) => sum + moneyDecimalToPence(order.total),
        0,
      ),
      loyaltyPoints: customer.loyaltyPoints,
    }))
    .sort((a, b) => b.totalSpentPence - a.totalSpentPence)
    .slice(0, 5);

  const totalPoints = customers.reduce((sum, customer) => sum + customer.loyaltyPoints, 0);
  const pointTransactions = await prisma.loyaltyPointTransaction.count({
    where: { businessId },
  });

  return {
    totalCustomers: customers.length,
    newCustomers,
    returningCustomers,
    vipCustomers,
    topSpenders,
    loyaltyStatistics: {
      totalPointsOutstanding: totalPoints,
      totalPointTransactions: pointTransactions,
    },
  };
}

export async function findOrCreateCustomerFromOrder(
  businessId: string,
  order: { customerName: string | null; customerPhone: string | null; customerId: string | null },
): Promise<string | null> {
  if (order.customerId) {
    return order.customerId;
  }

  if (!order.customerPhone && !order.customerName) {
    return null;
  }

  if (order.customerPhone) {
    const existing = await prisma.customer.findFirst({
      where: { businessId, phone: order.customerPhone, deletedAt: null },
      select: { id: true },
    });

    if (existing) {
      return existing.id;
    }
  }

  if (!order.customerName) {
    return null;
  }

  const customer = await prisma.customer.create({
    data: {
      businessId,
      name: order.customerName,
      phone: order.customerPhone,
      status: "ACTIVE",
    },
    select: { id: true },
  });

  return customer.id;
}

export async function processCrmForCompletedOrder(
  businessId: string,
  orderId: string,
  staffId: string | null,
  paymentId?: string | null,
): Promise<void> {
  const order = await prisma.order.findFirst({
    where: { id: orderId, businessId },
    select: {
      id: true,
      orderNumber: true,
      customerName: true,
      customerPhone: true,
      customerId: true,
      total: true,
    },
  });

  if (!order) {
    return;
  }

  const customerId = await findOrCreateCustomerFromOrder(businessId, order);

  if (!customerId) {
    return;
  }

  if (!order.customerId) {
    await prisma.order.update({
      where: { id: orderId },
      data: { customerId },
    });
  }

  await recordTimelineEvent(businessId, customerId, {
    staffId,
    eventType: "ORDER",
    title: `Order ${order.orderNumber} completed`,
    description: "Order marked as completed",
    orderId,
  });

  if (paymentId) {
    await recordTimelineEvent(businessId, customerId, {
      staffId,
      eventType: "PAYMENT",
      title: "Payment received",
      description: `Payment recorded for order ${order.orderNumber}`,
      orderId,
      paymentId,
    });
  }

  await earnPointsForOrder(businessId, customerId, orderId, staffId);
}

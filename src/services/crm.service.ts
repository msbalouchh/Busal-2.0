import "server-only";

import { type CustomerStatus, type CustomerTimelineEventType, type Prisma } from "@prisma/client";

import { customerRepository } from "@/modules/crm/repository/customer-repository";
import { buildCrmScopeFromInput } from "@/modules/crm/lib/crm-scope";
import { mapModuleStatusToPrisma } from "@/modules/crm/lib/crm-mappers";
import { branchFilter } from "@/modules/business-context/utils/branch-scope";
import { moneyDecimalToPence } from "@/modules/payments/utils/currency";
import { recordTimelineEvent } from "@/services/crm-timeline.service";
import { earnPointsForOrder } from "@/services/loyalty.service";
import { prisma } from "@/lib/prisma";

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
  await customerRepository.ensureDefaultCustomerGroups(businessId);
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
  const scope = buildCrmScopeFromInput({ businessId, userId: staffId ?? "system" });
  const nameParts = input.name.trim().split(/\s+/);
  const record = await customerRepository.create(
    scope,
    {
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      businessId,
      branchId: scope.branchId,
      firstName: nameParts[0] ?? input.name,
      lastName: nameParts.slice(1).join(" "),
      email: input.email ?? null,
      phone: input.phone ?? null,
      tagIds: input.tags ?? [],
      segmentIds: input.groupId ? [input.groupId] : [],
      status: input.status ? (input.status.toLowerCase() as "active") : undefined,
    },
    staffId,
  );

  if (input.address?.trim()) {
    await customerRepository.addAddress(scope, {
      customerId: record.customer.id,
      label: "Primary",
      line1: input.address.trim(),
      isDefault: true,
    });
  }

  if (input.notes?.trim()) {
    await customerRepository.addNote(scope, record.customer.id, input.notes.trim(), staffId);
  }

  return getCustomer(record.customer.id, businessId);
}

export async function updateCustomer(
  customerId: string,
  businessId: string,
  staffId: string | null,
  input: CustomerInput,
): Promise<CustomerData> {
  const scope = buildCrmScopeFromInput({ businessId, userId: staffId ?? "system" });
  const nameParts = input.name.trim().split(/\s+/);

  const updated = await customerRepository.update(
    scope,
    {
      customerId,
      firstName: nameParts[0] ?? input.name,
      lastName: nameParts.slice(1).join(" "),
      email: input.email ?? null,
      phone: input.phone ?? null,
      tagIds: input.tags,
      segmentIds: input.groupId ? [input.groupId] : undefined,
      status: input.status
        ? (input.status.toLowerCase() as "active" | "inactive" | "blocked")
        : undefined,
    },
    staffId,
  );

  if (!updated) {
    throw new Error("Customer not found");
  }

  return getCustomer(customerId, businessId);
}

export async function deactivateCustomer(
  customerId: string,
  businessId: string,
  staffId: string | null,
): Promise<void> {
  const scope = buildCrmScopeFromInput({ businessId, userId: staffId ?? "system" });
  const deleted = await customerRepository.softDelete(scope, customerId, staffId);

  if (!deleted) {
    throw new Error("Customer not found");
  }
}

export async function addCustomerNote(
  customerId: string,
  businessId: string,
  staffId: string | null,
  content: string,
): Promise<CustomerNoteData> {
  const scope = buildCrmScopeFromInput({ businessId, userId: staffId ?? "system" });
  await customerRepository.addNote(scope, customerId, content, staffId);

  const notes = await listCustomerNotes(customerId, businessId);
  return notes[0]!;
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

  const orders = await prisma.restaurantOrder.findMany({
    where: { customerId, businessId, ...branchFilter(branchId), status: "COMPLETED" },
    include: {
      items: { select: { productNameSnapshot: true, quantity: true } },
    },
    orderBy: [{ completedAt: "desc" }],
  });

  const totalSpentPence = orders.reduce(
    (sum, order) => sum + moneyDecimalToPence(order.totalAmount),
    0,
  );
  const totalOrders = orders.length;
  const averageOrderValuePence = totalOrders > 0 ? Math.trunc(totalSpentPence / totalOrders) : 0;

  const itemCounts = new Map<string, number>();
  for (const order of orders) {
    for (const item of order.items) {
      itemCounts.set(
        item.productNameSnapshot,
        (itemCounts.get(item.productNameSnapshot) ?? 0) + item.quantity,
      );
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
    lastOrderAt: orders[0]?.completedAt?.toISOString() ?? orders[0]?.placedAt.toISOString() ?? null,
    favouriteItems,
  };
}

export async function getCrmDashboard(businessId: string, branchId: string | null = null) {
  const scope = buildCrmScopeFromInput({ businessId, branchId });
  return customerRepository.getDashboard(scope, branchId);
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

  const customer = await createCustomer(businessId, null, {
    name: order.customerName,
    phone: order.customerPhone,
    status: "ACTIVE",
  });

  return customer.id;
}

export async function processCrmForCompletedOrder(
  businessId: string,
  orderId: string,
  staffId: string | null,
  paymentId?: string | null,
): Promise<void> {
  const order = await prisma.restaurantOrder.findFirst({
    where: { id: orderId, businessId },
    select: {
      id: true,
      orderNumber: true,
      customerId: true,
      totalAmount: true,
      customer: { select: { name: true, phone: true } },
    },
  });

  if (!order) {
    return;
  }

  const customerId = await findOrCreateCustomerFromOrder(businessId, {
    customerId: order.customerId,
    customerName: order.customer?.name ?? null,
    customerPhone: order.customer?.phone ?? null,
  });

  if (!customerId) {
    return;
  }

  if (!order.customerId) {
    await prisma.restaurantOrder.update({
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

export { mapModuleStatusToPrisma };

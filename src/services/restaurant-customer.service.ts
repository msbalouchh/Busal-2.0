import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { CUSTOMER_LIST_PAGE_SIZE } from "@/modules/customer-crm-management/constants/routes";
import {
  buildCustomerListWhere,
  buildFullName,
  resolveDisplayName,
  roundMoney,
  serializeImportRow,
  validateCustomerAddress,
  validateCustomerRegistration,
} from "@/modules/customer-crm-management/lib/customer-crm-validation";
import type {
  CustomerAddressInput,
  CustomerAddressRecord,
  CustomerCrmRecord,
  CustomerDashboardStats,
  CustomerImportRow,
  CustomerListQuery,
  CustomerListResult,
  CustomerMergeInput,
  CustomerPaymentHistoryItem,
  CustomerProfileBundle,
  CustomerRegistrationInput,
  CustomerReservationHistoryItem,
  CustomerOrderHistoryItem,
  CustomerTimelineItem,
  DuplicateCustomerMatch,
} from "@/modules/customer-crm-management/types/customer-crm-types";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";
import { recordTimelineEvent } from "@/services/crm-timeline.service";
import {
  ensureLoyaltyAccount,
  getLoyaltyTransactions,
  serializeLoyaltyAccount,
} from "@/services/restaurant-loyalty-account.service";

const customerInclude = {
  loyaltyAccount: true,
  addresses: { orderBy: [{ isDefault: "desc" as const }, { createdAt: "desc" as const }] },
} satisfies Prisma.CustomerInclude;

type CustomerPayload = Prisma.CustomerGetPayload<{ include: typeof customerInclude }>;

async function getOwnedBusinessId(ownerId: string): Promise<string> {
  const business = await getOrCreateBusinessForOwner(ownerId);
  return business.id;
}

function decimal(value: Prisma.Decimal | number): number {
  return Number(value);
}

async function generateCustomerCode(businessId: string): Promise<string> {
  const count = await prisma.customer.count({ where: { businessId } });
  return `CUS-${String(count + 1).padStart(6, "0")}`;
}

async function generateMembershipNumber(businessId: string): Promise<string> {
  const count = await prisma.loyaltyAccount.count({
    where: { customer: { businessId } },
  });
  return `LYT-${String(count + 1).padStart(6, "0")}`;
}

function serializeAddress(record: CustomerPayload["addresses"][number]): CustomerAddressRecord {
  return {
    id: record.id,
    label: record.label,
    addressLine1: record.addressLine1,
    addressLine2: record.addressLine2,
    city: record.city,
    postcode: record.postcode,
    country: record.country,
    latitude: record.latitude ? decimal(record.latitude) : null,
    longitude: record.longitude ? decimal(record.longitude) : null,
    isDefault: record.isDefault,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export function serializeCustomer(record: CustomerPayload): CustomerCrmRecord {
  return {
    id: record.id,
    businessId: record.businessId,
    customerCode: record.customerCode,
    firstName: record.firstName,
    lastName: record.lastName,
    fullName: record.fullName,
    name: record.name,
    email: record.email,
    phone: record.phone,
    dateOfBirth: record.dateOfBirth?.toISOString().slice(0, 10) ?? null,
    gender: record.gender,
    profileImage: record.profileImage,
    preferredLanguage: record.preferredLanguage,
    marketingConsent: record.marketingConsent,
    status: record.status,
    notes: record.notes,
    tags: record.tags,
    totalOrders: record.totalOrders,
    totalSpend: decimal(record.totalSpend),
    averageOrderValue: decimal(record.averageOrderValue),
    lastOrderAt: record.lastOrderAt?.toISOString() ?? null,
    lastVisitAt: record.lastVisitAt?.toISOString() ?? null,
    loyaltyPoints: record.loyaltyPoints,
    loyaltyAccount: record.loyaltyAccount ? serializeLoyaltyAccount(record.loyaltyAccount) : null,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function listManagedCustomers(
  ownerId: string,
  query: CustomerListQuery,
): Promise<CustomerListResult> {
  const businessId = await getOwnedBusinessId(ownerId);
  const pageSize = query.pageSize ?? CUSTOMER_LIST_PAGE_SIZE;
  const page = query.page ?? 1;
  const where = buildCustomerListWhere(businessId, query);

  const [total, records] = await Promise.all([
    prisma.customer.count({ where }),
    prisma.customer.findMany({
      where,
      include: customerInclude,
      orderBy: [{ lastOrderAt: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    items: records.map(serializeCustomer),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getManagedCustomer(
  ownerId: string,
  customerId: string,
): Promise<CustomerCrmRecord> {
  const businessId = await getOwnedBusinessId(ownerId);
  const record = await prisma.customer.findFirst({
    where: { id: customerId, businessId, deletedAt: null },
    include: customerInclude,
  });

  if (!record) throw new Error("Customer not found");
  return serializeCustomer(record);
}

export async function registerManagedCustomer(
  ownerId: string,
  input: CustomerRegistrationInput,
): Promise<CustomerCrmRecord> {
  validateCustomerRegistration(input);
  const businessId = await getOwnedBusinessId(ownerId);

  if (input.email) {
    const dup = await prisma.customer.findFirst({
      where: { businessId, email: input.email.trim(), deletedAt: null },
    });
    if (dup) throw new Error("Email already registered");
  }

  if (input.phone) {
    const dup = await prisma.customer.findFirst({
      where: { businessId, phone: input.phone.trim(), deletedAt: null },
    });
    if (dup) throw new Error("Phone already registered");
  }

  const displayName = resolveDisplayName(input);
  const record = await prisma.customer.create({
    data: {
      businessId,
      customerCode: await generateCustomerCode(businessId),
      firstName: input.firstName?.trim() || null,
      lastName: input.lastName?.trim() || null,
      fullName:
        input.fullName?.trim() || buildFullName(input.firstName, input.lastName) || displayName,
      name: displayName,
      email: input.email?.trim() || null,
      phone: input.phone?.trim() || null,
      dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : null,
      gender: input.gender?.trim() || null,
      profileImage: input.profileImage?.trim() || null,
      preferredLanguage: input.preferredLanguage?.trim() || null,
      marketingConsent: input.marketingConsent ?? false,
      notes: input.notes?.trim() || null,
      tags: input.tags ?? [],
      status: input.status ?? "ACTIVE",
      lastVisitAt: new Date(),
    },
    include: customerInclude,
  });

  await ensureLoyaltyAccount(record.id, await generateMembershipNumber(businessId));

  await recordTimelineEvent(businessId, record.id, {
    staffId: null,
    eventType: "PROFILE",
    title: "Customer registered",
    description: `${displayName} joined the CRM`,
  });

  const refreshed = await prisma.customer.findUniqueOrThrow({
    where: { id: record.id },
    include: customerInclude,
  });

  return serializeCustomer(refreshed);
}

export async function updateManagedCustomer(
  ownerId: string,
  customerId: string,
  input: CustomerRegistrationInput,
): Promise<CustomerCrmRecord> {
  validateCustomerRegistration(input);
  await getManagedCustomer(ownerId, customerId);

  const displayName = resolveDisplayName(input);
  const record = await prisma.customer.update({
    where: { id: customerId },
    data: {
      firstName: input.firstName?.trim() || null,
      lastName: input.lastName?.trim() || null,
      fullName:
        input.fullName?.trim() || buildFullName(input.firstName, input.lastName) || displayName,
      name: displayName,
      email: input.email?.trim() || null,
      phone: input.phone?.trim() || null,
      dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : null,
      gender: input.gender?.trim() || null,
      profileImage: input.profileImage?.trim() || null,
      preferredLanguage: input.preferredLanguage?.trim() || null,
      marketingConsent: input.marketingConsent ?? false,
      notes: input.notes?.trim() || null,
      tags: input.tags ?? [],
      status: input.status,
    },
    include: customerInclude,
  });

  return serializeCustomer(record);
}

export async function findDuplicateCustomers(
  ownerId: string,
  input: CustomerRegistrationInput,
): Promise<DuplicateCustomerMatch[]> {
  const businessId = await getOwnedBusinessId(ownerId);
  const matches: DuplicateCustomerMatch[] = [];

  if (input.email?.trim()) {
    const byEmail = await prisma.customer.findMany({
      where: { businessId, email: input.email.trim(), deletedAt: null },
      select: { id: true, name: true, email: true, phone: true },
    });
    matches.push(
      ...byEmail.map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        matchReason: "email" as const,
      })),
    );
  }

  if (input.phone?.trim()) {
    const byPhone = await prisma.customer.findMany({
      where: { businessId, phone: input.phone.trim(), deletedAt: null },
      select: { id: true, name: true, email: true, phone: true },
    });
    for (const c of byPhone) {
      if (!matches.some((m) => m.id === c.id)) {
        matches.push({
          id: c.id,
          name: c.name,
          email: c.email,
          phone: c.phone,
          matchReason: "phone",
        });
      }
    }
  }

  return matches;
}

export async function mergeManagedCustomers(
  ownerId: string,
  input: CustomerMergeInput,
): Promise<CustomerCrmRecord> {
  const businessId = await getOwnedBusinessId(ownerId);
  const [target, source] = await Promise.all([
    getManagedCustomer(ownerId, input.targetCustomerId),
    getManagedCustomer(ownerId, input.sourceCustomerId),
  ]);

  if (target.id === source.id) throw new Error("Cannot merge customer with itself");

  await prisma.$transaction(async (tx) => {
    await tx.restaurantOrder.updateMany({
      where: { customerId: source.id },
      data: { customerId: target.id },
    });
    await tx.reservation.updateMany({
      where: { customerId: source.id },
      data: { customerId: target.id },
    });
    await tx.customerAddress.updateMany({
      where: { customerId: source.id },
      data: { customerId: target.id },
    });
    await tx.customer.update({
      where: { id: target.id },
      data: {
        totalOrders: target.totalOrders + source.totalOrders,
        totalSpend: target.totalSpend + source.totalSpend,
        tags: [...new Set([...target.tags, ...source.tags])],
      },
    });
    await tx.customer.update({
      where: { id: source.id },
      data: { status: "ARCHIVED", deletedAt: new Date() },
    });
  });

  await syncCustomerOrderStats(ownerId, target.id);
  await recordTimelineEvent(businessId, target.id, {
    staffId: null,
    eventType: "PROFILE",
    title: "Customers merged",
    description: `Merged ${source.name} into ${target.name}`,
  });

  return getManagedCustomer(ownerId, target.id);
}

export async function syncCustomerStatsByBusinessId(
  businessId: string,
  customerId: string,
): Promise<void> {
  const orders = await prisma.restaurantOrder.findMany({
    where: {
      businessId,
      customerId,
      status: { not: "CANCELLED" },
      paymentStatus: { in: ["PAID", "PARTIALLY_PAID"] },
    },
    select: { totalAmount: true, placedAt: true },
    orderBy: { placedAt: "desc" },
  });

  const totalOrders = orders.length;
  const totalSpend = roundMoney(orders.reduce((sum, o) => sum + decimal(o.totalAmount), 0));
  const averageOrderValue = totalOrders > 0 ? roundMoney(totalSpend / totalOrders) : 0;

  await prisma.customer.update({
    where: { id: customerId },
    data: {
      totalOrders,
      totalSpend,
      averageOrderValue,
      lastOrderAt: orders[0]?.placedAt ?? null,
      lastVisitAt: orders[0]?.placedAt ?? null,
    },
  });
}

export async function syncCustomerOrderStats(ownerId: string, customerId: string): Promise<void> {
  const businessId = await getOwnedBusinessId(ownerId);
  await syncCustomerStatsByBusinessId(businessId, customerId);
}

export async function findOrCreateCustomerFromContact(
  businessId: string,
  contact: { name?: string | null; phone?: string | null; email?: string | null },
): Promise<string | null> {
  if (contact.phone) {
    const existing = await prisma.customer.findFirst({
      where: { businessId, phone: contact.phone.trim(), deletedAt: null },
    });
    if (existing) return existing.id;
  }

  if (contact.email) {
    const existing = await prisma.customer.findFirst({
      where: { businessId, email: contact.email.trim(), deletedAt: null },
    });
    if (existing) return existing.id;
  }

  if (!contact.name?.trim() && !contact.phone?.trim()) return null;

  const created = await prisma.customer.create({
    data: {
      businessId,
      customerCode: await generateCustomerCode(businessId),
      name: contact.name?.trim() || contact.phone?.trim() || "Guest",
      fullName: contact.name?.trim() || null,
      phone: contact.phone?.trim() || null,
      email: contact.email?.trim() || null,
      lastVisitAt: new Date(),
    },
  });

  await ensureLoyaltyAccount(created.id, await generateMembershipNumber(businessId));
  return created.id;
}

export async function getCustomerProfileBundle(
  ownerId: string,
  customerId: string,
): Promise<CustomerProfileBundle> {
  const businessId = await getOwnedBusinessId(ownerId);
  const customer = await getManagedCustomer(ownerId, customerId);

  const [addresses, timelineEvents, orders, reservations, payments, loyaltyTransactions] =
    await Promise.all([
      prisma.customerAddress.findMany({ where: { customerId }, orderBy: [{ isDefault: "desc" }] }),
      prisma.customerTimelineEvent.findMany({
        where: { customerId, businessId },
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
      prisma.restaurantOrder.findMany({
        where: { customerId, businessId },
        orderBy: { placedAt: "desc" },
        take: 20,
      }),
      prisma.reservation.findMany({
        where: { customerId, businessId },
        orderBy: { reservationDate: "desc" },
        take: 20,
      }),
      prisma.orderPayment.findMany({
        where: { order: { customerId, businessId } },
        orderBy: { paidAt: "desc" },
        take: 20,
      }),
      getLoyaltyTransactions(customerId),
    ]);

  const timeline: CustomerTimelineItem[] = timelineEvents.map((event) => ({
    id: event.id,
    type: event.eventType,
    title: event.title,
    description: event.description,
    createdAt: event.createdAt.toISOString(),
  }));

  return {
    customer,
    addresses: addresses.map((a) => serializeAddress(a as CustomerPayload["addresses"][number])),
    timeline,
    orders: orders.map((order): CustomerOrderHistoryItem => ({
      id: order.id,
      orderNumber: order.orderNumber,
      orderType: order.orderType,
      totalAmount: decimal(order.totalAmount),
      status: order.status,
      placedAt: order.placedAt.toISOString(),
    })),
    reservations: reservations.map((res): CustomerReservationHistoryItem => ({
      id: res.id,
      reservationNumber: res.reservationNumber,
      status: res.status,
      scheduledAt: res.reservationDate.toISOString(),
      partySize: res.partySize,
    })),
    payments: payments.map((payment): CustomerPaymentHistoryItem => ({
      id: payment.id,
      paymentNumber: payment.paymentNumber,
      amountPaid: decimal(payment.amountPaid),
      paymentMethod: payment.paymentMethod,
      paidAt: payment.paidAt?.toISOString() ?? null,
    })),
    loyaltyTransactions,
  };
}

export async function upsertCustomerAddress(
  ownerId: string,
  customerId: string,
  input: CustomerAddressInput,
  addressId?: string,
): Promise<CustomerAddressRecord> {
  validateCustomerAddress(input);
  await getManagedCustomer(ownerId, customerId);

  if (input.isDefault) {
    await prisma.customerAddress.updateMany({
      where: { customerId },
      data: { isDefault: false },
    });
  }

  const data = {
    label: input.label?.trim() || null,
    addressLine1: input.addressLine1.trim(),
    addressLine2: input.addressLine2?.trim() || null,
    city: input.city?.trim() || null,
    postcode: input.postcode?.trim() || null,
    country: input.country?.trim() || null,
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    isDefault: input.isDefault ?? false,
  };

  const record = addressId
    ? await prisma.customerAddress.update({ where: { id: addressId, customerId }, data })
    : await prisma.customerAddress.create({ data: { ...data, customerId } });

  return serializeAddress(record as CustomerPayload["addresses"][number]);
}

export async function importManagedCustomers(
  ownerId: string,
  rows: CustomerImportRow[],
): Promise<{ imported: number; skipped: number }> {
  let imported = 0;
  let skipped = 0;

  for (const row of rows) {
    try {
      const input = serializeImportRow(row);
      const duplicates = await findDuplicateCustomers(ownerId, input);
      if (duplicates.length > 0) {
        skipped += 1;
        continue;
      }
      await registerManagedCustomer(ownerId, input);
      imported += 1;
    } catch {
      skipped += 1;
    }
  }

  return { imported, skipped };
}

export async function exportManagedCustomers(ownerId: string): Promise<CustomerImportRow[]> {
  const businessId = await getOwnedBusinessId(ownerId);
  return exportManagedCustomersForBusiness(businessId);
}

export async function exportManagedCustomersForBusiness(
  businessId: string,
): Promise<CustomerImportRow[]> {
  const customers = await prisma.customer.findMany({
    where: { businessId, deletedAt: null },
    select: {
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      tags: true,
      notes: true,
      marketingConsent: true,
    },
  });

  return customers.map((c) => ({
    firstName: c.firstName ?? undefined,
    lastName: c.lastName ?? undefined,
    email: c.email ?? undefined,
    phone: c.phone ?? undefined,
    tags: c.tags.join(","),
    notes: c.notes ?? undefined,
    marketingConsent: c.marketingConsent ? "yes" : "no",
  }));
}

export async function getCustomerDashboardStats(ownerId: string): Promise<CustomerDashboardStats> {
  const businessId = await getOwnedBusinessId(ownerId);
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [totalCustomers, activeCustomers, newCustomersThisMonth, aggregates, loyaltyMembers] =
    await Promise.all([
      prisma.customer.count({ where: { businessId, deletedAt: null } }),
      prisma.customer.count({ where: { businessId, deletedAt: null, status: "ACTIVE" } }),
      prisma.customer.count({
        where: { businessId, deletedAt: null, createdAt: { gte: startOfMonth } },
      }),
      prisma.customer.aggregate({
        where: { businessId, deletedAt: null },
        _sum: { totalSpend: true, totalOrders: true },
        _avg: { averageOrderValue: true },
      }),
      prisma.loyaltyAccount.count({ where: { customer: { businessId, deletedAt: null } } }),
    ]);

  return {
    totalCustomers,
    activeCustomers,
    newCustomersThisMonth,
    totalLifetimeSpend: decimal(aggregates._sum.totalSpend ?? 0),
    averageOrderValue: decimal(aggregates._avg.averageOrderValue ?? 0),
    loyaltyMembers,
  };
}

export async function archiveManagedCustomer(ownerId: string, customerId: string): Promise<void> {
  await getManagedCustomer(ownerId, customerId);
  await prisma.customer.update({
    where: { id: customerId },
    data: { status: "ARCHIVED", deletedAt: new Date() },
  });
}

import "server-only";

import { type Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { DEFAULT_CUSTOMER_GROUPS } from "@/modules/crm/constants/routes";
import type { CrmTenantScope } from "@/modules/crm/lib/crm-scope";
import {
  customerRecordInclude,
  mapCustomerGroupToSegment,
  mapCustomerToRecord,
  mapModuleStatusToPrisma,
  mapPrismaStatusToModule,
  type PrismaCustomerWithRelations,
} from "@/modules/crm/lib/crm-mappers";
import type {
  CreateCustomerInput,
  CustomerRecord,
  CustomerSearchQuery,
  CustomerSegment,
  CustomerTag,
  UpdateCustomerInput,
} from "@/modules/crm/types/customer";
import { logCrmAudit } from "@/modules/crm/utils/crm-audit";
import { recordTimelineEvent } from "@/services/crm-timeline.service";

export interface CustomerSearchResult {
  records: CustomerRecord[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CustomerImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

export interface CustomerExportRow {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: string;
  tags: string;
  group: string | null;
  loyaltyPoints: number;
  totalOrders: number;
  totalSpend: string;
  createdAt: string;
}

function businessWhere(scope: CrmTenantScope, includeDeleted = false): Prisma.CustomerWhereInput {
  return {
    businessId: scope.businessId,
    ...(includeDeleted ? {} : { deletedAt: null }),
  };
}

function buildSearchWhere(
  scope: CrmTenantScope,
  query: CustomerSearchQuery,
): Prisma.CustomerWhereInput {
  const where: Prisma.CustomerWhereInput = businessWhere(scope, query.includeDeleted);

  if (query.status) {
    const prismaStatus = mapModuleStatusToPrisma(query.status);
    where.status = prismaStatus;

    if (query.status === "vip") {
      where.group = { slug: "vip" };
      where.status = "ACTIVE";
    }
  }

  if (query.segmentId) {
    where.groupId = query.segmentId;
  }

  if (query.tagId) {
    where.tags = { has: query.tagId };
  }

  if (query.query) {
    where.OR = [
      { name: { contains: query.query, mode: "insensitive" } },
      { firstName: { contains: query.query, mode: "insensitive" } },
      { lastName: { contains: query.query, mode: "insensitive" } },
      { email: { contains: query.query, mode: "insensitive" } },
      { phone: { contains: query.query, mode: "insensitive" } },
    ];
  }

  return where;
}

function resolveOrderBy(
  sortBy: CustomerSearchQuery["sortBy"] = "name",
  sortOrder: CustomerSearchQuery["sortOrder"] = "asc",
): Prisma.CustomerOrderByWithRelationInput {
  const direction = sortOrder === "desc" ? "desc" : "asc";

  switch (sortBy) {
    case "createdAt":
      return { createdAt: direction };
    case "lastOrderAt":
      return { lastOrderAt: direction };
    case "totalSpend":
      return { totalSpend: direction };
    default:
      return { name: direction };
  }
}

/** Prisma-backed customer repository with multi-tenant business scoping. */
export class CustomerRepository {
  async ensureDefaultCustomerGroups(businessId: string): Promise<void> {
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

  async getSegments(scope: CrmTenantScope): Promise<CustomerSegment[]> {
    await this.ensureDefaultCustomerGroups(scope.businessId);

    const groups = await prisma.customerGroup.findMany({
      where: { businessId: scope.businessId },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });

    const counts = await prisma.customer.groupBy({
      by: ["groupId"],
      where: { businessId: scope.businessId, deletedAt: null, groupId: { not: null } },
      _count: { _all: true },
    });

    const countMap = new Map(counts.map((entry) => [entry.groupId, entry._count._all] as const));

    return groups.map((group) =>
      mapCustomerGroupToSegment(group, scope, countMap.get(group.id) ?? 0),
    );
  }

  async getTags(scope: CrmTenantScope): Promise<CustomerTag[]> {
    const customers = await prisma.customer.findMany({
      where: businessWhere(scope),
      select: { tags: true },
    });

    const uniqueTags = new Set<string>();
    for (const customer of customers) {
      for (const tag of customer.tags) {
        uniqueTags.add(tag);
      }
    }

    return [...uniqueTags].sort().map((tag) => ({
      id: `${scope.businessId}:${tag.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      slug: tag.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      name: tag,
      color: "#64748B",
      tenantId: scope.tenantId,
    }));
  }

  async search(
    scope: CrmTenantScope,
    query: CustomerSearchQuery = {},
  ): Promise<CustomerSearchResult> {
    const page = query.page ?? 1;
    const pageSize = query.limit ?? query.pageSize ?? 20;
    const where = buildSearchWhere(scope, query);
    const segments = await this.getSegments(scope);

    const [total, customers] = await Promise.all([
      prisma.customer.count({ where }),
      prisma.customer.findMany({
        where,
        include: customerRecordInclude,
        orderBy: resolveOrderBy(query.sortBy, query.sortOrder),
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      records: customers.map((customer) => mapCustomerToRecord(customer, scope, segments)),
      total,
      page,
      pageSize,
    };
  }

  async list(scope: CrmTenantScope): Promise<CustomerRecord[]> {
    const result = await this.search(scope, { pageSize: 500 });
    return result.records;
  }

  async findById(
    scope: CrmTenantScope,
    customerId: string,
    includeDeleted = false,
  ): Promise<CustomerRecord | null> {
    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        businessId: scope.businessId,
        ...(includeDeleted ? {} : { deletedAt: null }),
      },
      include: customerRecordInclude,
    });

    if (!customer) {
      return null;
    }

    const segments = await this.getSegments(scope);
    return mapCustomerToRecord(customer, scope, segments);
  }

  async create(
    scope: CrmTenantScope,
    input: CreateCustomerInput,
    staffId: string | null = null,
  ): Promise<CustomerRecord> {
    const displayName = `${input.firstName} ${input.lastName}`.trim();
    const groupId = input.segmentIds?.[0] ?? null;
    const prismaStatus = mapModuleStatusToPrisma(input.status ?? "active");

    const customer = await prisma.customer.create({
      data: {
        businessId: scope.businessId,
        groupId,
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        fullName: displayName,
        name: displayName,
        email: input.email?.trim() || null,
        phone: input.phone?.trim() || null,
        tags: input.tagIds ?? [],
        status: prismaStatus,
        marketingConsent: false,
      },
      include: customerRecordInclude,
    });

    await recordTimelineEvent(scope.businessId, customer.id, {
      staffId,
      eventType: "PROFILE",
      title: "Customer created",
      description: `${displayName} added to CRM`,
    });

    await logCrmAudit(scope.businessId, {
      staffId,
      entityType: "customer",
      entityId: customer.id,
      action: "CREATED",
    });

    const segments = await this.getSegments(scope);
    return mapCustomerToRecord(customer, scope, segments);
  }

  async update(
    scope: CrmTenantScope,
    input: UpdateCustomerInput,
    staffId: string | null = null,
  ): Promise<CustomerRecord | null> {
    const existing = await prisma.customer.findFirst({
      where: { id: input.customerId, businessId: scope.businessId, deletedAt: null },
      select: { id: true },
    });

    if (!existing) {
      return null;
    }

    const data: Prisma.CustomerUpdateInput = {};

    if (input.firstName || input.lastName) {
      const current = await prisma.customer.findUnique({
        where: { id: input.customerId },
        select: { firstName: true, lastName: true, name: true },
      });

      const firstName = input.firstName ?? current?.firstName ?? current?.name ?? "";
      const lastName = input.lastName ?? current?.lastName ?? "";
      const displayName = `${firstName} ${lastName}`.trim();

      data.firstName = firstName;
      data.lastName = lastName;
      data.fullName = displayName;
      data.name = displayName || current?.name;
    }

    if (input.email !== undefined) data.email = input.email?.trim() || null;
    if (input.phone !== undefined) data.phone = input.phone?.trim() || null;
    if (input.status) data.status = mapModuleStatusToPrisma(input.status);
    if (input.tagIds) data.tags = input.tagIds;
    if (input.segmentIds) data.group = { connect: { id: input.segmentIds[0] } };

    const customer = await prisma.customer.update({
      where: { id: input.customerId },
      data,
      include: customerRecordInclude,
    });

    await recordTimelineEvent(scope.businessId, customer.id, {
      staffId,
      eventType: "PROFILE",
      title: "Profile updated",
      description: "Customer profile details were updated",
    });

    await logCrmAudit(scope.businessId, {
      staffId,
      entityType: "customer",
      entityId: customer.id,
      action: "UPDATED",
    });

    const segments = await this.getSegments(scope);
    return mapCustomerToRecord(customer, scope, segments);
  }

  async softDelete(
    scope: CrmTenantScope,
    customerId: string,
    staffId: string | null = null,
  ): Promise<boolean> {
    const result = await prisma.customer.updateMany({
      where: { id: customerId, businessId: scope.businessId, deletedAt: null },
      data: { status: "INACTIVE", deletedAt: new Date() },
    });

    if (result.count === 0) {
      return false;
    }

    await logCrmAudit(scope.businessId, {
      staffId,
      entityType: "customer",
      entityId: customerId,
      action: "SOFT_DELETED",
    });

    return true;
  }

  async restore(
    scope: CrmTenantScope,
    customerId: string,
    staffId: string | null = null,
  ): Promise<boolean> {
    const result = await prisma.customer.updateMany({
      where: { id: customerId, businessId: scope.businessId, deletedAt: { not: null } },
      data: { status: "ACTIVE", deletedAt: null },
    });

    if (result.count === 0) {
      return false;
    }

    await logCrmAudit(scope.businessId, {
      staffId,
      entityType: "customer",
      entityId: customerId,
      action: "RESTORED",
    });

    return true;
  }

  async mergeCustomers(
    scope: CrmTenantScope,
    primaryCustomerId: string,
    secondaryCustomerId: string,
    staffId: string | null = null,
  ): Promise<CustomerRecord | null> {
    if (primaryCustomerId === secondaryCustomerId) {
      throw new Error("Cannot merge a customer with itself");
    }

    const [primary, secondary] = await Promise.all([
      prisma.customer.findFirst({
        where: { id: primaryCustomerId, businessId: scope.businessId, deletedAt: null },
      }),
      prisma.customer.findFirst({
        where: { id: secondaryCustomerId, businessId: scope.businessId, deletedAt: null },
      }),
    ]);

    if (!primary || !secondary) {
      return null;
    }

    await prisma.$transaction(async (tx) => {
      await tx.legacyOrder.updateMany({
        where: { customerId: secondaryCustomerId, businessId: scope.businessId },
        data: { customerId: primaryCustomerId },
      });

      await tx.reservation.updateMany({
        where: { customerId: secondaryCustomerId },
        data: { customerId: primaryCustomerId },
      });

      await tx.customerNote.updateMany({
        where: { customerId: secondaryCustomerId },
        data: { customerId: primaryCustomerId },
      });

      await tx.customerTimelineEvent.updateMany({
        where: { customerId: secondaryCustomerId, businessId: scope.businessId },
        data: { customerId: primaryCustomerId },
      });

      await tx.loyaltyPointTransaction.updateMany({
        where: { customerId: secondaryCustomerId, businessId: scope.businessId },
        data: { customerId: primaryCustomerId },
      });

      await tx.customer.update({
        where: { id: primaryCustomerId },
        data: {
          loyaltyPoints: primary.loyaltyPoints + secondary.loyaltyPoints,
          totalOrders: primary.totalOrders + secondary.totalOrders,
          totalSpend: primary.totalSpend.add(secondary.totalSpend),
          tags: [...new Set([...primary.tags, ...secondary.tags])],
          notes: [primary.notes, secondary.notes].filter(Boolean).join("\n\n") || null,
        },
      });

      await tx.customer.update({
        where: { id: secondaryCustomerId },
        data: { status: "ARCHIVED", deletedAt: new Date() },
      });
    });

    await recordTimelineEvent(scope.businessId, primaryCustomerId, {
      staffId,
      eventType: "PROFILE",
      title: "Customers merged",
      description: `Merged ${secondary.name} into ${primary.name}`,
    });

    await logCrmAudit(scope.businessId, {
      staffId,
      entityType: "customer",
      entityId: primaryCustomerId,
      action: "MERGED",
      metadata: { secondaryCustomerId },
    });

    return this.findById(scope, primaryCustomerId);
  }

  async addNote(
    scope: CrmTenantScope,
    customerId: string,
    content: string,
    staffId: string | null = null,
  ): Promise<void> {
    const exists = await prisma.customer.findFirst({
      where: { id: customerId, businessId: scope.businessId, deletedAt: null },
      select: { id: true },
    });

    if (!exists) {
      throw new Error("Customer not found");
    }

    await prisma.customerNote.create({
      data: { customerId, staffId, content: content.trim() },
    });

    await recordTimelineEvent(scope.businessId, customerId, {
      staffId,
      eventType: "NOTE",
      title: "Internal note added",
      description: content.trim(),
    });
  }

  async addAddress(
    scope: CrmTenantScope,
    input: {
      customerId: string;
      label: string;
      line1: string;
      line2?: string | null;
      city?: string;
      postalCode?: string;
      country?: string;
      isDefault?: boolean;
    },
  ): Promise<void> {
    const exists = await prisma.customer.findFirst({
      where: { id: input.customerId, businessId: scope.businessId, deletedAt: null },
      select: { id: true },
    });

    if (!exists) {
      throw new Error("Customer not found");
    }

    if (input.isDefault) {
      await prisma.customerAddress.updateMany({
        where: { customerId: input.customerId },
        data: { isDefault: false },
      });
    }

    await prisma.customerAddress.create({
      data: {
        customerId: input.customerId,
        label: input.label,
        addressLine1: input.line1,
        addressLine2: input.line2 ?? null,
        city: input.city ?? null,
        postcode: input.postalCode ?? null,
        country: input.country ?? "GB",
        isDefault: input.isDefault ?? false,
      },
    });
  }

  async exportCustomers(scope: CrmTenantScope): Promise<CustomerExportRow[]> {
    const customers = await prisma.customer.findMany({
      where: businessWhere(scope),
      include: { group: { select: { name: true, slug: true } } },
      orderBy: [{ name: "asc" }],
    });

    return customers.map((customer) => ({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      status: mapPrismaStatusToModule(customer.status, customer.group?.slug),
      tags: customer.tags.join(";"),
      group: customer.group?.name ?? null,
      loyaltyPoints: customer.loyaltyPoints,
      totalOrders: customer.totalOrders,
      totalSpend: customer.totalSpend.toString(),
      createdAt: customer.createdAt.toISOString(),
    }));
  }

  async importCustomers(
    scope: CrmTenantScope,
    rows: Array<{
      name: string;
      email?: string | null;
      phone?: string | null;
      tags?: string;
      group?: string;
    }>,
    staffId: string | null = null,
  ): Promise<CustomerImportResult> {
    await this.ensureDefaultCustomerGroups(scope.businessId);

    const groups = await prisma.customerGroup.findMany({
      where: { businessId: scope.businessId },
    });

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const [index, row] of rows.entries()) {
      try {
        if (!row.name.trim()) {
          skipped += 1;
          continue;
        }

        if (row.email) {
          const existingEmail = await prisma.customer.findFirst({
            where: { businessId: scope.businessId, email: row.email, deletedAt: null },
            select: { id: true },
          });

          if (existingEmail) {
            skipped += 1;
            continue;
          }
        }

        if (row.phone) {
          const existingPhone = await prisma.customer.findFirst({
            where: { businessId: scope.businessId, phone: row.phone, deletedAt: null },
            select: { id: true },
          });

          if (existingPhone) {
            skipped += 1;
            continue;
          }
        }

        const group = row.group
          ? groups.find((entry) => entry.slug === row.group || entry.name === row.group)
          : null;

        const nameParts = row.name.trim().split(/\s+/);
        const firstName = nameParts[0] ?? row.name;
        const lastName = nameParts.slice(1).join(" ");

        await this.create(
          scope,
          {
            tenantId: scope.tenantId,
            workspaceId: scope.workspaceId,
            businessId: scope.businessId,
            branchId: scope.branchId,
            firstName,
            lastName,
            email: row.email ?? null,
            phone: row.phone ?? null,
            tagIds: row.tags
              ? row.tags
                  .split(";")
                  .map((tag) => tag.trim())
                  .filter(Boolean)
              : [],
            segmentIds: group ? [group.id] : [],
          },
          staffId,
        );

        imported += 1;
      } catch (error) {
        errors.push(
          `Row ${index + 1}: ${error instanceof Error ? error.message : "Import failed"}`,
        );
      }
    }

    return { imported, skipped, errors };
  }

  async getDashboard(scope: CrmTenantScope, branchId: string | null = null) {
    const branchFilter = branchId ? { branchId } : {};

    const customers = await prisma.customer.findMany({
      where: businessWhere(scope),
      select: {
        id: true,
        name: true,
        loyaltyPoints: true,
        createdAt: true,
        group: { select: { slug: true, name: true } },
        legacyOrders: {
          where: { status: "COMPLETED", ...branchFilter },
          select: { total: true },
        },
      },
    });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const newCustomers = customers.filter((customer) => customer.createdAt >= thirtyDaysAgo).length;
    const returningCustomers = customers.filter(
      (customer) => customer.legacyOrders.length > 1,
    ).length;
    const vipCustomers = customers.filter((customer) => customer.group?.slug === "vip").length;

    const topSpenders = customers
      .map((customer) => ({
        id: customer.id,
        name: customer.name,
        totalSpentPence: customer.legacyOrders.reduce(
          (sum, order) => sum + Math.round(Number(order.total) * 100),
          0,
        ),
        loyaltyPoints: customer.loyaltyPoints,
      }))
      .sort((left, right) => right.totalSpentPence - left.totalSpentPence)
      .slice(0, 5);

    const totalPoints = customers.reduce((sum, customer) => sum + customer.loyaltyPoints, 0);
    const pointTransactions = await prisma.loyaltyPointTransaction.count({
      where: { businessId: scope.businessId },
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
}

export const customerRepository = new CustomerRepository();

export type { PrismaCustomerWithRelations };

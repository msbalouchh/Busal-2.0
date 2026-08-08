import "server-only";

import type { Prisma, TenantLifecycleStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { OWNER_PERMISSION_KEYS, TENANT_PERMISSION_CATALOG } from "@/modules/tenant/constants/permissions";
import { ORGANIZATION_STATUSES } from "@/modules/tenant/types/status";
import { TENANT_STATUSES, WORKSPACE_STATUSES, BUSINESS_STATUSES } from "@/modules/tenant/types/status";
import type { TenantSelection } from "@/modules/tenant/types/entities";
import type { TenantSnapshot } from "@/modules/tenant/types/context";
import type {
  Branch,
  Business,
  Organization,
  StaffMember,
  Tenant,
  Workspace,
} from "@/modules/tenant/types/entities";
import type { Role } from "@/modules/tenant/types/rbac";
import { assertSelectionIntegrity } from "@/modules/tenant/utils/tenant-isolation";
import { DOMAIN_EVENT_TYPES } from "@/modules/platform-orchestration/constants/domain-events";
import { publishModuleDomainEvent } from "@/modules/platform-orchestration/lib/publish-module-event";
import {
  ensureTenantPlatformDefaults,
  provisionTenantForBusiness,
} from "@/services/tenant-platform.service";
import { commercialLimitsService } from "@/modules/commercial-foundation/services/commercial-limits.service";
import { assignFeaturesForPlan, updateTenantPlanLimits } from "@/modules/commercial-foundation/services/stripe-billing.service";
import { subscriptionLifecycleService } from "@/modules/commercial-foundation/services/subscription-lifecycle.service";
import { usageTrackingService } from "@/modules/commercial-foundation/services/usage-tracking.service";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function mapLifecycleToTenantStatus(status: TenantLifecycleStatus): Tenant["status"] {
  switch (status) {
    case "ACTIVE":
      return TENANT_STATUSES.ACTIVE;
    case "SUSPENDED":
      return TENANT_STATUSES.SUSPENDED;
    case "PENDING":
      return TENANT_STATUSES.TRIAL;
    case "ARCHIVED":
      return TENANT_STATUSES.CHURNED;
    default:
      return TENANT_STATUSES.ACTIVE;
  }
}

function mapBranchStatus(isActive: boolean): Branch["status"] {
  return isActive ? "active" : "inactive";
}

function buildHierarchyIds(businessId: string) {
  return {
    tenantId: businessId,
    organizationId: `${businessId}-org`,
    workspaceId: `${businessId}-ws`,
    businessId,
  };
}

function mapBusinessEntity(
  business: {
    id: string;
    businessName: string | null;
    industry: string | null;
    timezone: string | null;
    currency: string | null;
    createdAt: Date;
  },
  lifecycleStatus: TenantLifecycleStatus,
): Business {
  const ids = buildHierarchyIds(business.id);
  return {
    id: ids.businessId,
    tenantId: ids.tenantId,
    organizationId: ids.organizationId,
    workspaceId: ids.workspaceId,
    slug: slugify(business.businessName ?? business.id),
    name: business.businessName ?? "Business",
    industry: (business.industry ?? "restaurant") as Business["industry"],
    status: lifecycleStatus === "SUSPENDED" ? BUSINESS_STATUSES.INACTIVE : BUSINESS_STATUSES.ACTIVE,
    timezone: business.timezone ?? "UTC",
    currency: business.currency ?? "GBP",
    createdAt: business.createdAt.toISOString(),
  };
}

function mapBranchEntity(
  branch: {
    id: string;
    businessId: string;
    name: string;
    isMain: boolean;
    isActive: boolean;
    timezone: string | null;
    createdAt: Date;
  },
): Branch {
  const ids = buildHierarchyIds(branch.businessId);
  return {
    id: branch.id,
    tenantId: ids.tenantId,
    organizationId: ids.organizationId,
    workspaceId: ids.workspaceId,
    businessId: ids.businessId,
    slug: slugify(branch.name),
    name: branch.name,
    status: mapBranchStatus(branch.isActive),
    isMain: branch.isMain,
    timezone: branch.timezone ?? "UTC",
    createdAt: branch.createdAt.toISOString(),
  };
}

function mapTenantEntity(
  business: { id: string; businessName: string | null; industry: string | null; createdAt: Date },
  lifecycleStatus: TenantLifecycleStatus,
): Tenant {
  const ids = buildHierarchyIds(business.id);
  return {
    id: ids.tenantId,
    slug: slugify(business.businessName ?? business.id),
    name: business.businessName ?? "Tenant",
    industry: (business.industry ?? "restaurant") as Tenant["industry"],
    status: mapLifecycleToTenantStatus(lifecycleStatus),
    organizationId: ids.organizationId,
    createdAt: business.createdAt.toISOString(),
  };
}

function mapOrganizationEntity(
  business: { id: string; businessName: string | null; createdAt: Date },
  lifecycleStatus: TenantLifecycleStatus,
): Organization {
  const ids = buildHierarchyIds(business.id);
  return {
    id: ids.organizationId,
    tenantId: ids.tenantId,
    slug: slugify(business.businessName ?? business.id),
    name: business.businessName ?? "Organization",
    status: lifecycleStatus === "SUSPENDED" ? ORGANIZATION_STATUSES.SUSPENDED : ORGANIZATION_STATUSES.ACTIVE,
    createdAt: business.createdAt.toISOString(),
  };
}

function mapWorkspaceEntity(
  business: { id: string; businessName: string | null; createdAt: Date },
  lifecycleStatus: TenantLifecycleStatus,
): Workspace {
  const ids = buildHierarchyIds(business.id);
  return {
    id: ids.workspaceId,
    tenantId: ids.tenantId,
    organizationId: ids.organizationId,
    businessId: ids.businessId,
    slug: slugify(business.businessName ?? business.id),
    name: business.businessName ?? "Workspace",
    status: lifecycleStatus === "SUSPENDED" ? WORKSPACE_STATUSES.ARCHIVED : WORKSPACE_STATUSES.ACTIVE,
    createdAt: business.createdAt.toISOString(),
  };
}

function defaultOwnerRole(workspaceId: string): Role {
  return {
    id: `${workspaceId}-owner`,
    workspaceId,
    slug: "owner",
    name: "Owner",
    description: "Full workspace ownership",
    permissionKeys: OWNER_PERMISSION_KEYS,
    isSystem: true,
  };
}

async function publishTenantEvent(
  businessId: string,
  eventType: string,
  payload: Record<string, unknown>,
): Promise<void> {
  await publishModuleDomainEvent(
    {
      tenantId: businessId,
      workspaceId: `${businessId}-ws`,
      businessId,
      branchId: null,
      userId: "system",
    },
    {
      eventType,
      aggregateId: businessId,
      payload,
    },
  );
}

/** Production tenant foundation — maps Business/TenantRecord to tenant hierarchy. */
export class TenantFoundationService {
  async buildSnapshotForBusiness(businessId: string, branchId?: string): Promise<TenantSnapshot> {
    await ensureTenantPlatformDefaults(businessId);

    const [business, tenantRecord, branches, members, staffRows] = await Promise.all([
      prisma.business.findUniqueOrThrow({ where: { id: businessId } }),
      prisma.tenantRecord.findUnique({ where: { businessId } }),
      prisma.branch.findMany({ where: { businessId }, orderBy: [{ isMain: "desc" }, { createdAt: "asc" }] }),
      prisma.businessMember.findMany({
        where: { businessId, status: "ACTIVE" },
        include: { user: true, memberRoles: { include: { role: true } } },
      }),
      prisma.staff.findMany({ where: { businessId, isActive: true }, take: 50 }),
    ]);

    const lifecycleStatus = tenantRecord?.lifecycleStatus ?? "ACTIVE";
    const tenant = mapTenantEntity(business, lifecycleStatus);
    const organization = mapOrganizationEntity(business, lifecycleStatus);
    const workspace = mapWorkspaceEntity(business, lifecycleStatus);
    const mappedBusiness = mapBusinessEntity(business, lifecycleStatus);
    const mappedBranches = branches.map(mapBranchEntity);
    const branch =
      mappedBranches.find((entry) => entry.id === branchId) ??
      mappedBranches.find((entry) => entry.isMain) ??
      mappedBranches[0];

    if (!branch) {
      throw new Error(`No branch found for business ${businessId}`);
    }

    const selection: TenantSelection = {
      tenantId: tenant.id,
      organizationId: organization.id,
      workspaceId: workspace.id,
      businessId: mappedBusiness.id,
      branchId: branch.id,
    };

    assertSelectionIntegrity(selection);

    const staff: StaffMember[] = staffRows.map((member) => ({
      id: member.id,
      tenantId: tenant.id,
      organizationId: organization.id,
      workspaceId: workspace.id,
      businessId: mappedBusiness.id,
      branchId: member.branchId,
      userId: member.userId ?? member.id,
      email: member.email ?? "",
      fullName: member.fullName,
      roleSlug: "manager",
      status: member.isActive ? "active" : "inactive",
      permissionKeys: [],
      createdAt: member.createdAt.toISOString(),
    }));

    for (const member of members) {
      if (member.role === "OWNER") {
        staff.unshift({
          id: member.id,
          tenantId: tenant.id,
          organizationId: organization.id,
          workspaceId: workspace.id,
          businessId: mappedBusiness.id,
          branchId: branch.id,
          userId: member.userId,
          email: member.user.email,
          fullName: member.user.fullName,
          roleSlug: "owner",
          status: "active",
          permissionKeys: OWNER_PERMISSION_KEYS,
          createdAt: member.createdAt.toISOString(),
        });
      }
    }

    return {
      tenant,
      organization,
      workspace,
      business: mappedBusiness,
      branch,
      staff,
      roles: [defaultOwnerRole(workspace.id)],
      permissions: TENANT_PERMISSION_CATALOG,
      organizations: [organization],
      workspaces: [workspace],
      businesses: [mappedBusiness],
      branches: mappedBranches,
      selection,
    };
  }

  async listAccessibleSnapshots(userId: string): Promise<TenantSnapshot[]> {
    const memberships = await prisma.businessMember.findMany({
      where: { userId, status: "ACTIVE" },
      select: { businessId: true },
    });

    const snapshots: TenantSnapshot[] = [];
    for (const membership of memberships) {
      snapshots.push(await this.buildSnapshotForBusiness(membership.businessId));
    }

    return snapshots;
  }

  async createTenant(input: {
    ownerId: string;
    businessName: string;
    country?: string;
    timezone?: string;
    planSlug?: string;
  }): Promise<{ businessId: string }> {
    const business = await prisma.business.create({
      data: {
        ownerId: input.ownerId,
        businessName: input.businessName,
        country: input.country,
        timezone: input.timezone ?? "UTC",
      },
    });

    await prisma.businessMember.create({
      data: {
        businessId: business.id,
        userId: input.ownerId,
        role: "OWNER",
        status: "ACTIVE",
      },
    });

    await publishTenantEvent(business.id, DOMAIN_EVENT_TYPES.TENANT_CREATED, {
      businessName: input.businessName,
    });

    return { businessId: business.id };
  }

  async createWorkspace(input: {
    businessId: string;
    name: string;
  }): Promise<{ workspaceId: string }> {
    const workspaceId = `${input.businessId}-ws`;

    await publishTenantEvent(input.businessId, DOMAIN_EVENT_TYPES.WORKSPACE_CREATED, {
      workspaceId,
      name: input.name,
    });

    return { workspaceId };
  }

  async createBusinessBranch(input: {
    businessId: string;
    name: string;
    isMain?: boolean;
  }): Promise<{ branchId: string }> {
    await commercialLimitsService.assertBranchLimit(input.businessId);

    const branch = await prisma.branch.create({
      data: {
        businessId: input.businessId,
        name: input.name,
        isMain: input.isMain ?? false,
        isActive: true,
      },
    });

    await usageTrackingService.increment({
      businessId: input.businessId,
      metric: "branches",
      amount: 1,
    });

    await publishTenantEvent(input.businessId, DOMAIN_EVENT_TYPES.BUSINESS_UPDATED, {
      branchId: branch.id,
      action: "branch_created",
    });

    return { branchId: branch.id };
  }

  async suspendTenant(businessId: string, userId?: string): Promise<void> {
    await prisma.tenantRecord.update({
      where: { businessId },
      data: { lifecycleStatus: "SUSPENDED", suspendedAt: new Date(), subscriptionStatus: "PAUSED" },
    });

    await publishTenantEvent(businessId, DOMAIN_EVENT_TYPES.BUSINESS_SUSPENDED, { userId });
  }

  async activateTenant(businessId: string, userId?: string): Promise<void> {
    await prisma.tenantRecord.update({
      where: { businessId },
      data: {
        lifecycleStatus: "ACTIVE",
        suspendedAt: null,
        subscriptionStatus: "ACTIVE",
      },
    });

    await publishTenantEvent(businessId, DOMAIN_EVENT_TYPES.BUSINESS_ACTIVATED, { userId });
  }

  async deleteTenant(businessId: string): Promise<void> {
    await prisma.tenantRecord.update({
      where: { businessId },
      data: { lifecycleStatus: "ARCHIVED", deletedAt: new Date(), subscriptionStatus: "CANCELLED" },
    });

    await publishTenantEvent(businessId, DOMAIN_EVENT_TYPES.BUSINESS_UPDATED, { action: "deleted" });
  }

  async transferOwnership(businessId: string, newOwnerId: string): Promise<void> {
    const business = await prisma.business.findUniqueOrThrow({ where: { id: businessId } });

    await prisma.$transaction([
      prisma.business.update({
        where: { id: businessId },
        data: { ownerId: newOwnerId },
      }),
      prisma.businessMember.updateMany({
        where: { businessId, userId: business.ownerId },
        data: { role: "MEMBER" },
      }),
      prisma.businessMember.upsert({
        where: { businessId_userId: { businessId, userId: newOwnerId } },
        create: { businessId, userId: newOwnerId, role: "OWNER", status: "ACTIVE" },
        update: { role: "OWNER", status: "ACTIVE" },
      }),
    ]);
  }

  async provisionCommercialStack(businessId: string, planSlug = "starter"): Promise<void> {
    await provisionTenantForBusiness(businessId);
    await subscriptionLifecycleService.assignPlan(businessId, planSlug);
    await assignFeaturesForPlan(businessId, planSlug);
    await updateTenantPlanLimits(businessId, planSlug);

    const modules = await assignFeaturesForPlan(businessId, planSlug);
    for (const moduleKey of modules) {
      await publishTenantEvent(businessId, DOMAIN_EVENT_TYPES.FEATURE_ENABLED, { moduleKey });
    }

    await publishTenantEvent(businessId, DOMAIN_EVENT_TYPES.AI_CONTEXT_UPDATED, { businessId });
  }
}

export const tenantFoundationService = new TenantFoundationService();

import "server-only";

import { prisma } from "@/lib/prisma";
import { DOMAIN_EVENT_TYPES } from "@/modules/platform-orchestration/constants/domain-events";
import { publishModuleDomainEvent } from "@/modules/platform-orchestration/lib/publish-module-event";
import { tenantFoundationService } from "@/modules/tenant/services/tenant-foundation.service";
import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";

export interface PlatformProvisioningInput {
  ownerId: string;
  businessName: string;
  country?: string;
  timezone?: string;
  planSlug?: string;
  branchName?: string;
  ownerEmail?: string;
  businessId?: string;
}

export interface PlatformProvisioningResult {
  businessId: string;
  workspaceId: string;
  branchId: string;
  tenantId: string;
  planSlug: string;
}

function scope(businessId: string, userId: string) {
  return {
    tenantId: businessId,
    workspaceId: `${businessId}-ws`,
    businessId,
    branchId: null,
    userId,
  };
}

/** Full commercial onboarding: tenant → workspace → business → branch → owner role → subscription → features → AI → events. */
export class PlatformProvisioningService {
  async provisionNewBusiness(input: PlatformProvisioningInput): Promise<PlatformProvisioningResult> {
    if (input.businessId) {
      return this.provisionExistingBusiness(input as PlatformProvisioningInput & { businessId: string });
    }

    const planSlug = input.planSlug ?? "starter";

    const { businessId } = await tenantFoundationService.createTenant({
      ownerId: input.ownerId,
      businessName: input.businessName,
      country: input.country,
      timezone: input.timezone,
      planSlug,
    });

    return this.finalizeCommercialProvisioning({
      businessId,
      ownerId: input.ownerId,
      businessName: input.businessName,
      branchName: input.branchName,
      planSlug,
    });
  }

  async provisionExistingBusiness(
    input: PlatformProvisioningInput & { businessId: string },
  ): Promise<PlatformProvisioningResult> {
    const planSlug = input.planSlug ?? "starter";

    await prisma.business.update({
      where: { id: input.businessId },
      data: {
        businessName: input.businessName,
        country: input.country,
        timezone: input.timezone ?? "UTC",
      },
    });

    return this.finalizeCommercialProvisioning({
      businessId: input.businessId,
      ownerId: input.ownerId,
      businessName: input.businessName,
      branchName: input.branchName,
      planSlug,
    });
  }

  private async finalizeCommercialProvisioning(input: {
    businessId: string;
    ownerId: string;
    businessName: string;
    branchName?: string;
    planSlug: string;
  }): Promise<PlatformProvisioningResult> {
    const { businessId, ownerId, businessName, branchName, planSlug } = input;

    const { workspaceId } = await tenantFoundationService.createWorkspace({
      businessId,
      name: `${businessName} Workspace`,
    });

    const existingBranch = await prisma.branch.findFirst({
      where: { businessId, isMain: true },
      select: { id: true },
    });

    let branchId = existingBranch?.id;
    if (!branchId) {
      const created = await tenantFoundationService.createBusinessBranch({
        businessId,
        name: branchName ?? "Main Branch",
        isMain: true,
      });
      branchId = created.branchId;
    } else if (branchName && branchName !== "Main Branch") {
      await prisma.branch.update({
        where: { id: branchId },
        data: { name: branchName },
      });
    }

    await this.ensureOwnerRole(businessId, ownerId);
    await tenantFoundationService.provisionCommercialStack(businessId, planSlug);
    await tenantFoundationService.activateTenant(businessId, ownerId);

    await publishModuleDomainEvent(scope(businessId, ownerId), {
      eventType: DOMAIN_EVENT_TYPES.SUBSCRIPTION_CREATED,
      aggregateId: businessId,
      payload: { planSlug, branchId, workspaceId },
    });

    return {
      businessId,
      workspaceId,
      branchId: branchId!,
      tenantId: businessId,
      planSlug,
    };
  }

  private async ensureOwnerRole(businessId: string, ownerId: string): Promise<void> {
    const existingRole = await prisma.role.findFirst({
      where: { businessId, slug: "owner" },
    });

    const role =
      existingRole ??
      (await prisma.role.create({
        data: {
          businessId,
          slug: "owner",
          name: "Owner",
          description: "Business owner with full access",
          isSystem: true,
        },
      }));

    const member = await prisma.businessMember.findUnique({
      where: { businessId_userId: { businessId, userId: ownerId } },
    });

    if (member) {
      await prisma.memberRoleAssignment.upsert({
        where: {
          businessMemberId_roleId: {
            businessMemberId: member.id,
            roleId: role.id,
          },
        },
        create: {
          businessMemberId: member.id,
          roleId: role.id,
        },
        update: {},
      });
    }

    await publishModuleDomainEvent(scope(businessId, ownerId), {
      eventType: DOMAIN_EVENT_TYPES.STAFF_CREATED,
      aggregateId: role.id,
      payload: { roleSlug: "owner", permission: PERMISSION_CODES.TENANT_PLATFORM_MANAGE },
    });
  }
}

export const platformProvisioningService = new PlatformProvisioningService();

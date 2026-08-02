import "server-only";

import { BusinessMemberRole, BusinessMemberStatus } from "@prisma/client";

import { BUSINESS_MEMBER_ROLES } from "@/constants/business-member";
import { prisma } from "@/lib/prisma";

export async function ensureOwnerBusinessMember(businessId: string, userId: string) {
  return prisma.businessMember.upsert({
    where: {
      businessId_userId: {
        businessId,
        userId,
      },
    },
    create: {
      businessId,
      userId,
      role: BusinessMemberRole.OWNER,
      status: BusinessMemberStatus.ACTIVE,
    },
    update: {
      role: BusinessMemberRole.OWNER,
      status: BusinessMemberStatus.ACTIVE,
    },
  });
}

export async function getActiveBusinessMembership(userId: string, businessId: string) {
  return prisma.businessMember.findFirst({
    where: {
      userId,
      businessId,
      status: BusinessMemberStatus.ACTIVE,
    },
  });
}

export async function userHasOwnerAccess(userId: string, businessId: string): Promise<boolean> {
  const membership = await getActiveBusinessMembership(userId, businessId);
  return membership?.role === BUSINESS_MEMBER_ROLES.OWNER;
}

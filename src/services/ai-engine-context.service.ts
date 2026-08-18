import "server-only";

import type { BusinessContext } from "@/modules/business-context/types/business-context";
import { prisma } from "@/lib/prisma";
import {
  getOrCreateBusinessForOwner,
  getOwnedBusinessById,
} from "@/services/business-profile.service";

export interface ModulePlatformContext {
  tenantId?: string;
  workspaceId?: string;
  businessId: string;
  branchId?: string | null;
  userId?: string;
}

/** Builds production BusinessContext for centralized AI engine execution. */
export async function resolveBusinessContextForOwner(ownerId: string): Promise<BusinessContext> {
  const business = await getOrCreateBusinessForOwner(ownerId);
  const user = await prisma.user.findUniqueOrThrow({ where: { id: ownerId } });

  const { resolveAuthorizationContext } =
    await import("@/modules/authorization/services/authorization.service");
  const { mapProfileToAuthUser } = await import("@/services/user.service");

  const authUser = mapProfileToAuthUser(user.id, user.email, user, {});
  const authorization = await resolveAuthorizationContext(authUser, business);

  return {
    user: authUser,
    business,
    branch: null,
    branchId: null,
    roleSlug: authorization.roleSlug,
    permissions: Array.from(authorization.permissions),
    authorization,
    staffSession: null,
    isOwner: authorization.isOwner,
    accessibleBusinesses: [],
    accessibleBranches: [],
  };
}

/** Builds production BusinessContext from module platform context IDs. */
export async function resolveBusinessContextFromModule(
  context: ModulePlatformContext,
): Promise<BusinessContext> {
  const businessRecord = await prisma.business.findUniqueOrThrow({
    where: { id: context.businessId },
    select: { ownerId: true },
  });
  const userId = context.userId ?? businessRecord.ownerId;
  const business =
    (await getOwnedBusinessById(userId, context.businessId)) ??
    (await getOwnedBusinessById(businessRecord.ownerId, context.businessId));

  if (!business) {
    throw new Error(`Business not found: ${context.businessId}`);
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  const branch = context.branchId
    ? await prisma.branch.findFirst({
        where: { id: context.branchId, businessId: context.businessId },
      })
    : null;

  const { resolveAuthorizationContext } =
    await import("@/modules/authorization/services/authorization.service");
  const { mapProfileToAuthUser } = await import("@/services/user.service");

  const authUser = mapProfileToAuthUser(user.id, user.email, user, {});
  const authorization = await resolveAuthorizationContext(authUser, business);

  return {
    user: authUser,
    business,
    branch,
    branchId: branch?.id ?? null,
    roleSlug: authorization.roleSlug,
    permissions: Array.from(authorization.permissions),
    authorization,
    staffSession: null,
    isOwner: authorization.isOwner,
    accessibleBusinesses: [],
    accessibleBranches: [],
  };
}

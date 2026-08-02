import "server-only";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import type { BusinessContext } from "@/modules/business-context/types/business-context";
import { buildOperatorTenantPlatformContext } from "@/modules/control-center/tenants/lib/build-operator-tenant-context";
import type { ControlCenterOperatorContext } from "@/modules/control-center/types/control-center-types";
import { prisma } from "@/lib/prisma";

const PLATFORM_SERVICE_PERMISSIONS = [
  PERMISSION_CODES.SETTINGS_VIEW,
  PERMISSION_CODES.SETTINGS_EDIT,
  PERMISSION_CODES.SETTINGS_MANAGE,
  PERMISSION_CODES.SETTINGS_ADMIN,
  PERMISSION_CODES.FEATURE_FLAGS_VIEW,
  PERMISSION_CODES.FEATURE_FLAGS_MANAGE,
  PERMISSION_CODES.FEATURE_FLAGS_ADMIN,
  PERMISSION_CODES.IAM_VIEW,
  PERMISSION_CODES.IAM_ADMIN,
  PERMISSION_CODES.IAM_MANAGE_SESSIONS,
  PERMISSION_CODES.IAM_MANAGE_IDENTITIES,
  PERMISSION_CODES.TENANT_PLATFORM_VIEW,
  PERMISSION_CODES.TENANT_PLATFORM_MANAGE,
  PERMISSION_CODES.TENANT_PLATFORM_ADMIN,
] as const;

export async function resolvePlatformBusinessId(): Promise<string> {
  const business = await prisma.business.findFirst({
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  if (!business) {
    throw new Error("No platform business found");
  }

  return business.id;
}

export async function buildOperatorPlatformContext(
  operator: ControlCenterOperatorContext,
  businessId?: string,
): Promise<BusinessContext> {
  const resolvedBusinessId = businessId ?? (await resolvePlatformBusinessId());
  const platform = await buildOperatorTenantPlatformContext(operator, resolvedBusinessId);

  platform.permissions = Array.from(
    new Set([...platform.permissions, ...PLATFORM_SERVICE_PERMISSIONS]),
  );

  return platform;
}

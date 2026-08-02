import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { ROUTES } from "@/constants/routes";
import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import {
  hasPermission,
  resolveAuthorizationContext,
} from "@/modules/authorization/services/authorization.service";
import { permissionDenied } from "@/modules/authorization/utils/authorization-errors";
import { requireApplicationAccess } from "@/modules/application-shell/lib/require-application-access";
import { getIndustryModule } from "@/modules/business-modules/registry/module-registry";
import type {
  BusinessModuleBundle,
  BusinessModuleRecord,
} from "@/services/business-module.service";
import {
  getBusinessModuleBundle,
  getBusinessModuleRecord,
} from "@/services/business-module.service";
import { getCurrentUser } from "@/services/auth.service";
import { getBusinessByOwnerId } from "@/services/business-profile.service";
import type { AuthUser } from "@/types/auth";
import type { AuthorizationContext } from "@/modules/authorization/types/authorization";
import type { BusinessProfileData } from "@/types/business-profile";
import type { SerializedIndustryModuleDefinition } from "@/modules/business-modules/types/business-module-types";

export interface BusinessModulePermissions {
  canView: boolean;
  canInstall: boolean;
  canEnable: boolean;
  canDisable: boolean;
  canManage: boolean;
}

export interface BusinessModulesContext {
  user: AuthUser;
  business: BusinessProfileData & { id: string };
  authorization: AuthorizationContext;
  bundle: BusinessModuleBundle;
  permissionsFlags: BusinessModulePermissions;
}

export interface BusinessModuleDetailsContext extends BusinessModulesContext {
  moduleKey: string;
  definition: SerializedIndustryModuleDefinition;
  installation: BusinessModuleRecord | null;
}

function buildBusinessModulePermissions(
  authorization: AuthorizationContext,
): BusinessModulePermissions {
  const { permissions, isOwner } = authorization;

  return {
    canView: isOwner || hasPermission(permissions, PERMISSION_CODES.MODULES_VIEW),
    canInstall: isOwner || hasPermission(permissions, PERMISSION_CODES.MODULES_INSTALL),
    canEnable:
      isOwner ||
      hasPermission(permissions, PERMISSION_CODES.MODULES_ENABLE) ||
      hasPermission(permissions, PERMISSION_CODES.MODULES_MANAGE),
    canDisable:
      isOwner ||
      hasPermission(permissions, PERMISSION_CODES.MODULES_DISABLE) ||
      hasPermission(permissions, PERMISSION_CODES.MODULES_MANAGE),
    canManage: isOwner || hasPermission(permissions, PERMISSION_CODES.MODULES_MANAGE),
  };
}

export async function resolveBusinessModulesBusinessForUser(
  user: AuthUser,
): Promise<BusinessProfileData & { id: string }> {
  const business = await getBusinessByOwnerId(user.id);

  if (!business?.id) {
    throw permissionDenied();
  }

  return business;
}

export const getBusinessModulesContext = cache(async (): Promise<BusinessModulesContext> => {
  const user = await requireApplicationAccess();
  const business = await resolveBusinessModulesBusinessForUser(user);
  const authorization = await resolveAuthorizationContext(user, business);
  const permissionsFlags = buildBusinessModulePermissions(authorization);

  if (!permissionsFlags.canView) {
    redirect(ROUTES.application);
  }

  const bundle = await getBusinessModuleBundle(business.id);

  return {
    user,
    business,
    authorization,
    bundle,
    permissionsFlags,
  };
});

export const getBusinessModuleDetailsContext = cache(
  async (moduleKey: string): Promise<BusinessModuleDetailsContext | null> => {
    const definition = getIndustryModule(moduleKey);

    if (!definition) {
      return null;
    }

    const context = await getBusinessModulesContext();
    const installation = await getBusinessModuleRecord(context.business.id, moduleKey);

    return {
      ...context,
      moduleKey,
      definition: {
        moduleKey: definition.moduleKey,
        displayName: definition.displayName,
        iconKey: definition.iconKey,
        description: definition.description,
        version: definition.version,
        category: definition.category,
        permissions: definition.permissions,
        routes: definition.routes,
        futureCapabilities: definition.futureCapabilities,
      },
      installation,
    };
  },
);

export async function requireBusinessModuleActionContext(
  permission: (typeof PERMISSION_CODES)[keyof typeof PERMISSION_CODES],
): Promise<BusinessModulesContext> {
  const user = await getCurrentUser();

  if (!user) {
    throw permissionDenied();
  }

  const business = await resolveBusinessModulesBusinessForUser(user);
  const authorization = await resolveAuthorizationContext(user, business);

  if (!hasPermission(authorization.permissions, permission) && !authorization.isOwner) {
    throw permissionDenied();
  }

  const bundle = await getBusinessModuleBundle(business.id);

  return {
    user,
    business,
    authorization,
    bundle,
    permissionsFlags: buildBusinessModulePermissions(authorization),
  };
}

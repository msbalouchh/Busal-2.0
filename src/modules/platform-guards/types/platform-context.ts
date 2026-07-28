import type { BusinessContext } from "@/modules/business-context/types/business-context";
import type { PermissionCode } from "@/modules/authorization/types/authorization";
import type { RouteGuardOptions } from "@/modules/authorization/types/authorization";
import type { ProtectedActionRequirement } from "@/modules/authorization/lib/protected-action";

export type PlatformContext = BusinessContext;

export type PlatformPageGuardOptions = RouteGuardOptions;

export type PlatformActionRequirement = ProtectedActionRequirement;

export type PlatformRouteGuardOptions = RouteGuardOptions;

export interface PlatformActionContext {
  context: PlatformContext;
  permission: PermissionCode | PermissionCode[];
}

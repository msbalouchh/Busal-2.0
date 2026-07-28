export {
  requireAuthentication,
  requireAuthenticationForAction,
  requireAuthenticationForApi,
} from "@/modules/platform-guards/guards/authentication.guards";
export {
  requireBusiness,
  requireBusinessContext,
  requireBusinessContextForPlatformApi,
} from "@/modules/platform-guards/guards/business.guards";
export {
  requireAllPermissions,
  requireAnyPermission,
  requirePermission,
  requireRole,
} from "@/modules/platform-guards/guards/authorization.guards";
export {
  requireOnboarding,
  requireOnboardingForApi,
  requireOnboardingIncomplete,
} from "@/modules/platform-guards/guards/onboarding.guards";
export { requireStaff } from "@/modules/platform-guards/guards/staff.guards";
export { protectedPage } from "@/modules/platform-guards/guards/page.guards";
export { protectedAction } from "@/modules/platform-guards/guards/action.guards";
export {
  handlePlatformRouteError,
  platformGuardErrorResponse,
  protectedRoute,
} from "@/modules/platform-guards/guards/route.guards";

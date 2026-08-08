export {
  PLATFORM_MODULE_KEYS,
  ALL_PLATFORM_MODULE_KEYS,
  PLATFORM_MODULE_LABELS,
  FEATURE_REGISTRY,
  type PlatformModuleKey,
} from "@/modules/finance/feature-access/constants/feature-registry";

export {
  SUBSCRIPTION_PLAN_KEYS,
  SUBSCRIPTION_PLAN_LABELS,
  PLAN_MODULE_ENTITLEMENTS,
  ACTIVE_SUBSCRIPTION_STATUSES,
  type SubscriptionPlanKey,
} from "@/modules/finance/feature-access/constants/subscription-plans";

export type {
  ResolvedSubscription,
  FeatureAccessContext,
  FeatureAccessDeniedPayload,
} from "@/modules/finance/feature-access/types/feature-access.types";

export {
  SubscriptionResolver,
  subscriptionResolver,
  type TenantSubscriptionRecord,
} from "@/modules/finance/feature-access/services/subscription-resolver.service";

export { PlanResolver, planResolver } from "@/modules/finance/feature-access/services/plan-resolver.service";

export {
  FeatureResolver,
  featureResolver,
  isModuleEnabled,
} from "@/modules/finance/feature-access/services/feature-resolver.service";

export {
  FeaturePermissionService,
  featurePermissionService,
  FINANCE_MODULE_KEY,
} from "@/modules/finance/feature-access/services/feature-permission.service";

export {
  assertFeatureModuleAccess,
  assertFinanceFeatureAccess,
  assertFinanceFeatureFromPlatform,
  hasFinanceFeatureAccess,
} from "@/modules/finance/feature-access/guards/feature.guard";

export {
  assertPlatformModuleAccess,
  assertPlatformModuleFromContext,
  hasPlatformModuleAccess,
  filterNavigationByEntitlements,
} from "@/modules/feature-access/guards/platform-feature.guard";

export {
  MODULE_ROUTE_MAP,
  resolveModuleKeyForPath,
} from "@/modules/feature-access/constants/module-route-map";

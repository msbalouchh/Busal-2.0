import type { PlatformModuleKey } from "@/modules/finance/feature-access/constants/feature-registry";
import type { SubscriptionPlanKey } from "@/modules/finance/feature-access/constants/subscription-plans";

export interface ResolvedSubscription {
  businessId: string;
  plan: SubscriptionPlanKey;
  planLabel: string;
  status: string;
  isActive: boolean;
  assignedFeatures: PlatformModuleKey[];
  enabledModules: PlatformModuleKey[];
  source: "plan" | "custom" | "plan_and_custom";
}

export interface FeatureAccessContext {
  businessId: string;
  subscription: ResolvedSubscription;
}

export interface FeatureAccessDeniedPayload {
  code: "FEATURE_ACCESS_DENIED";
  moduleKey: PlatformModuleKey;
  plan: SubscriptionPlanKey;
  message: string;
  upgradeRequired: true;
}

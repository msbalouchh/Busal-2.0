import { registerFeatureDefinition } from "@/modules/feature-flags/registry/feature-registry";
import type { RegisteredFeatureDefinition } from "@/modules/feature-flags/types/feature-flags-types";

const DEFAULT_FEATURES: Omit<RegisteredFeatureDefinition, "isActive">[] = [
  {
    key: "ai.automation.enabled",
    module: "ai-automation",
    name: "AI Automation",
    description: "Enable AI automation workflows",
    flagType: "BOOLEAN",
    defaultEnabled: true,
  },
  {
    key: "marketplace.beta_catalog",
    module: "marketplace",
    name: "Beta Marketplace Catalog",
    description: "Expose beta marketplace assets",
    flagType: "PERCENTAGE_ROLLOUT",
    defaultEnabled: false,
  },
  {
    key: "pos.new_checkout",
    module: "pos",
    name: "New POS Checkout",
    description: "Roll out redesigned POS checkout experience",
    flagType: "PERCENTAGE_ROLLOUT",
    defaultEnabled: false,
  },
  {
    key: "communication.omnichannel_v2",
    module: "communication",
    name: "Omnichannel Inbox V2",
    description: "Enable communication center v2",
    flagType: "SCHEDULED_ACTIVATION",
    defaultEnabled: false,
  },
  {
    key: "search.semantic_preview",
    module: "search",
    name: "Semantic Search Preview",
    description: "Preview semantic search capabilities",
    flagType: "CONDITIONAL",
    defaultEnabled: false,
  },
  {
    key: "crm.advanced_pipeline",
    module: "crm",
    name: "Advanced CRM Pipeline",
    description: "Advanced sales pipeline features",
    flagType: "BOOLEAN",
    defaultEnabled: true,
  },
  {
    key: "inventory.auto_reorder",
    module: "inventory",
    name: "Auto Reorder",
    description: "Automatic inventory reorder suggestions",
    flagType: "BOOLEAN",
    defaultEnabled: false,
  },
  {
    key: "reporting.realtime_dashboard",
    module: "reporting",
    name: "Realtime Reporting Dashboard",
    description: "Realtime analytics dashboard",
    flagType: "SCHEDULED_DEACTIVATION",
    defaultEnabled: true,
  },
];

let bootstrapped = false;

export function ensureBootstrapFeatureFlags(): void {
  if (bootstrapped) {
    return;
  }

  for (const feature of DEFAULT_FEATURES) {
    registerFeatureDefinition({ ...feature, isActive: true });
  }

  bootstrapped = true;
}

export function resetBootstrapFeatureFlags(): void {
  bootstrapped = false;
}

export function getDefaultFeatureCount(): number {
  return DEFAULT_FEATURES.length;
}

export const DEFAULT_REGISTERED_FEATURES = DEFAULT_FEATURES;

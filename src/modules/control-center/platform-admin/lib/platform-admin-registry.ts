import type { ControlCenterPlatformModuleItem } from "@/modules/control-center/platform-admin/types/control-center-platform-admin-types";

const platformModules = new Map<string, ControlCenterPlatformModuleItem>();

const DEFAULT_PLATFORM_MODULES: ControlCenterPlatformModuleItem[] = [
  {
    key: "tenant-platform",
    name: "Tenant Administration",
    category: "Core",
    enabled: true,
    description: "Tenant lifecycle, policies, and resource governance.",
  },
  {
    key: "iam",
    name: "Identity & Access",
    category: "Security",
    enabled: true,
    description: "Sessions, API keys, MFA, and access policies.",
  },
  {
    key: "settings-engine",
    name: "Settings Engine",
    category: "Configuration",
    enabled: true,
    description: "Scoped configuration with inheritance and audit.",
  },
  {
    key: "feature-flags",
    name: "Feature Flags",
    category: "Configuration",
    enabled: true,
    description: "Gradual rollout and environment targeting.",
  },
  {
    key: "api-gateway",
    name: "API Gateway",
    category: "Integration",
    enabled: true,
    description: "Route registry, throttling, and gateway audit.",
  },
  {
    key: "monitoring-platform",
    name: "Monitoring",
    category: "Operations",
    enabled: true,
    description: "Health checks, alerts, logs, and incidents.",
  },
  {
    key: "notification-hub",
    name: "Notification Hub",
    category: "Communication",
    enabled: true,
    description: "Multi-channel notification delivery.",
  },
  {
    key: "communication-center",
    name: "Communication Center",
    category: "Communication",
    enabled: true,
    description: "Support conversations and internal notes.",
  },
  {
    key: "ai-platform",
    name: "AI Platform",
    category: "Intelligence",
    enabled: true,
    description: "Agents, tools, knowledge, and usage metering.",
  },
  {
    key: "marketplace-platform",
    name: "Marketplace",
    category: "Commerce",
    enabled: true,
    description: "Publisher assets, licensing, and revenue.",
  },
  {
    key: "billing-platform",
    name: "Billing",
    category: "Commerce",
    enabled: true,
    description: "Subscriptions, invoices, and payments.",
  },
  {
    key: "backup-platform",
    name: "Backup & Recovery",
    category: "Infrastructure",
    enabled: true,
    description: "Backup policies, records, and recovery jobs.",
  },
  {
    key: "localization-platform",
    name: "Localization",
    category: "Experience",
    enabled: true,
    description: "Language packs and translation management.",
  },
  {
    key: "audit-system",
    name: "Audit System",
    category: "Governance",
    enabled: true,
    description: "Cross-module audit aggregation.",
  },
];

let initialized = false;

export function ensurePlatformAdminRegistry(): void {
  if (initialized) {
    return;
  }

  for (const platformModule of DEFAULT_PLATFORM_MODULES) {
    platformModules.set(platformModule.key, platformModule);
  }

  initialized = true;
}

export function registerPlatformAdminModule(platformModule: ControlCenterPlatformModuleItem): void {
  ensurePlatformAdminRegistry();
  platformModules.set(platformModule.key, platformModule);
}

export function listPlatformAdminModules(): ControlCenterPlatformModuleItem[] {
  ensurePlatformAdminRegistry();
  return Array.from(platformModules.values()).sort((left, right) =>
    left.name.localeCompare(right.name),
  );
}

export function resetPlatformAdminRegistry(): void {
  platformModules.clear();
  initialized = false;
}

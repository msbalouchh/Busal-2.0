import type { PlatformConsumptionConfig } from "@/modules/platform/types/platform-config.types";

export interface ControlCenterPlatformSummary {
  deploymentMode: PlatformConsumptionConfig["deploymentMode"];
  whiteLabelEnabled: boolean;
  platformStatus: PlatformConsumptionConfig["platformStatus"];
  subdomain: string | null;
  customDomain: string | null;
  customDomainVerified: boolean;
  apiEnabled: boolean;
  webhooksEnabled: boolean;
  embedEnabled: boolean;
  apiKeyCount: number;
  webhookCount: number;
}

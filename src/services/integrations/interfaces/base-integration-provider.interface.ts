import type { IntegrationCategory } from "@prisma/client";

export interface IntegrationConnectionTestResult {
  success: boolean;
  message: string;
}

export interface IntegrationSyncResult {
  success: boolean;
  message: string;
  recordsProcessed?: number;
}

export interface BaseIntegrationProvider {
  readonly providerId: string;
  readonly category: IntegrationCategory;
  isAvailable(): boolean;
  testConnection(config: Record<string, unknown>): Promise<IntegrationConnectionTestResult>;
  sync(config: Record<string, unknown>): Promise<IntegrationSyncResult>;
}

export const PROVIDER_NOT_CONFIGURED =
  "Provider not configured. Register an implementation via IntegrationProviderRegistry.";

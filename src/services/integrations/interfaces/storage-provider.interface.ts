import type {
  IntegrationConnectionTestResult,
  IntegrationSyncResult,
} from "@/services/integrations/interfaces/base-integration-provider.interface";
import { PROVIDER_NOT_CONFIGURED } from "@/services/integrations/interfaces/base-integration-provider.interface";

export interface StorageProvider {
  readonly providerId: string;
  readonly category: "OTHER" | "PRODUCTIVITY";
  isAvailable(): boolean;
  testConnection(config: Record<string, unknown>): Promise<IntegrationConnectionTestResult>;
  sync(config: Record<string, unknown>): Promise<IntegrationSyncResult>;
  uploadFile?(path: string, data: Buffer): Promise<{ success: boolean; url?: string }>;
}

export class NoopStorageProvider implements StorageProvider {
  readonly providerId = "noop-storage";
  readonly category = "OTHER" as const;

  isAvailable(): boolean {
    return false;
  }

  async testConnection(): Promise<IntegrationConnectionTestResult> {
    throw new Error(PROVIDER_NOT_CONFIGURED);
  }

  async sync(): Promise<IntegrationSyncResult> {
    throw new Error(PROVIDER_NOT_CONFIGURED);
  }
}

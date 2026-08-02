import type {
  IntegrationConnectionTestResult,
  IntegrationSyncResult,
} from "@/services/integrations/interfaces/base-integration-provider.interface";
import { PROVIDER_NOT_CONFIGURED } from "@/services/integrations/interfaces/base-integration-provider.interface";

export interface AccountingProvider {
  readonly providerId: string;
  readonly category: "ACCOUNTING";
  isAvailable(): boolean;
  testConnection(config: Record<string, unknown>): Promise<IntegrationConnectionTestResult>;
  sync(config: Record<string, unknown>): Promise<IntegrationSyncResult>;
  syncInvoices?(): Promise<IntegrationSyncResult>;
}

export class NoopAccountingProvider implements AccountingProvider {
  readonly providerId = "noop-accounting";
  readonly category = "ACCOUNTING" as const;

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

import type {
  IntegrationConnectionTestResult,
  IntegrationSyncResult,
} from "@/services/integrations/interfaces/base-integration-provider.interface";
import { PROVIDER_NOT_CONFIGURED } from "@/services/integrations/interfaces/base-integration-provider.interface";

export interface AutomationProvider {
  readonly providerId: string;
  readonly category: "AUTOMATION";
  isAvailable(): boolean;
  testConnection(config: Record<string, unknown>): Promise<IntegrationConnectionTestResult>;
  sync(config: Record<string, unknown>): Promise<IntegrationSyncResult>;
  triggerWorkflow?(
    workflowId: string,
    payload: Record<string, unknown>,
  ): Promise<{ success: boolean }>;
}

export class NoopAutomationProvider implements AutomationProvider {
  readonly providerId = "noop-automation";
  readonly category = "AUTOMATION" as const;

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

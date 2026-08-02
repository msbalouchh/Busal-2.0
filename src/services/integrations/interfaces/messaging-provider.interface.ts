import type {
  BaseIntegrationProvider,
  IntegrationConnectionTestResult,
  IntegrationSyncResult,
} from "@/services/integrations/interfaces/base-integration-provider.interface";
import { PROVIDER_NOT_CONFIGURED } from "@/services/integrations/interfaces/base-integration-provider.interface";

export interface MessagingProvider extends BaseIntegrationProvider {
  readonly category: "MESSAGING" | "COMMUNICATION";
  sendMessage?(to: string, body: string): Promise<{ success: boolean; messageId?: string }>;
}

export class NoopMessagingProvider implements MessagingProvider {
  readonly providerId = "noop-messaging";
  readonly category = "MESSAGING" as const;

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

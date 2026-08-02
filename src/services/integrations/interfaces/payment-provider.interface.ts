import type {
  BaseIntegrationProvider,
  IntegrationConnectionTestResult,
  IntegrationSyncResult,
} from "@/services/integrations/interfaces/base-integration-provider.interface";
import { PROVIDER_NOT_CONFIGURED } from "@/services/integrations/interfaces/base-integration-provider.interface";

export interface PaymentProvider extends BaseIntegrationProvider {
  readonly category: "PAYMENT";
  capturePayment?(amount: number, currency: string): Promise<{ success: boolean }>;
}

export class NoopPaymentProvider implements PaymentProvider {
  readonly providerId = "noop-payment";
  readonly category = "PAYMENT" as const;

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

import type {
  IntegrationConnectionTestResult,
  IntegrationSyncResult,
} from "@/services/integrations/interfaces/base-integration-provider.interface";
import { PROVIDER_NOT_CONFIGURED } from "@/services/integrations/interfaces/base-integration-provider.interface";

export interface CalendarProvider {
  readonly providerId: string;
  readonly category: "PRODUCTIVITY";
  isAvailable(): boolean;
  testConnection(config: Record<string, unknown>): Promise<IntegrationConnectionTestResult>;
  sync(config: Record<string, unknown>): Promise<IntegrationSyncResult>;
  listEvents?(): Promise<{ events: Array<{ id: string; title: string }> }>;
}

export class NoopCalendarProvider implements CalendarProvider {
  readonly providerId = "noop-calendar";
  readonly category = "PRODUCTIVITY" as const;

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

import type {
  BaseCommunicationProvider,
  CommunicationSendResult,
} from "@/services/communications/interfaces/base-communication-provider.interface";
import { providerNotConfigured } from "@/services/communications/interfaces/base-communication-provider.interface";

export interface NotificationProvider extends BaseCommunicationProvider {
  channelType: "IN_APP";
  sendNotification(input: {
    userId: string;
    title: string;
    body: string;
    data?: Record<string, unknown>;
  }): Promise<CommunicationSendResult>;
}

export function createNotificationProviderStub(providerId: string): NotificationProvider {
  return {
    providerId,
    channelType: "IN_APP",
    isAvailable: () => false,
    sendMessage: async () => providerNotConfigured(providerId),
    sendNotification: async () => providerNotConfigured(providerId),
  };
}

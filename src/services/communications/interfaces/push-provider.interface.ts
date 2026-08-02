import type {
  BaseCommunicationProvider,
  CommunicationSendResult,
} from "@/services/communications/interfaces/base-communication-provider.interface";
import { providerNotConfigured } from "@/services/communications/interfaces/base-communication-provider.interface";

export interface PushProvider extends BaseCommunicationProvider {
  channelType: "PUSH";
  sendPush(input: {
    token: string;
    title: string;
    body: string;
    data?: Record<string, string>;
  }): Promise<CommunicationSendResult>;
}

export function createPushProviderStub(providerId: string): PushProvider {
  return {
    providerId,
    channelType: "PUSH",
    isAvailable: () => false,
    sendMessage: async () => providerNotConfigured(providerId),
    sendPush: async () => providerNotConfigured(providerId),
  };
}

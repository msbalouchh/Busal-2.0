import type {
  BaseCommunicationProvider,
  CommunicationSendResult,
} from "@/services/communications/interfaces/base-communication-provider.interface";
import { providerNotConfigured } from "@/services/communications/interfaces/base-communication-provider.interface";

export interface SmsProvider extends BaseCommunicationProvider {
  channelType: "SMS";
  sendSms(input: { to: string; body: string }): Promise<CommunicationSendResult>;
}

export function createSmsProviderStub(providerId: string): SmsProvider {
  return {
    providerId,
    channelType: "SMS",
    isAvailable: () => false,
    sendMessage: async () => providerNotConfigured(providerId),
    sendSms: async () => providerNotConfigured(providerId),
  };
}

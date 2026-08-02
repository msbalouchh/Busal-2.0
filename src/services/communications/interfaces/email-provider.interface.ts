import type {
  BaseCommunicationProvider,
  CommunicationSendResult,
} from "@/services/communications/interfaces/base-communication-provider.interface";
import { providerNotConfigured } from "@/services/communications/interfaces/base-communication-provider.interface";

export interface EmailProvider extends BaseCommunicationProvider {
  channelType: "EMAIL";
  sendEmail(input: {
    to: string;
    subject: string;
    html: string;
    text?: string;
  }): Promise<CommunicationSendResult>;
}

export function createEmailProviderStub(providerId: string): EmailProvider {
  return {
    providerId,
    channelType: "EMAIL",
    isAvailable: () => false,
    sendMessage: async () => providerNotConfigured(providerId),
    sendEmail: async () => providerNotConfigured(providerId),
  };
}

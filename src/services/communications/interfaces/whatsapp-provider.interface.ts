import type {
  BaseCommunicationProvider,
  CommunicationSendResult,
} from "@/services/communications/interfaces/base-communication-provider.interface";
import { providerNotConfigured } from "@/services/communications/interfaces/base-communication-provider.interface";

export interface WhatsAppProvider extends BaseCommunicationProvider {
  channelType: "WHATSAPP";
  sendWhatsApp(input: {
    to: string;
    body: string;
    templateId?: string;
  }): Promise<CommunicationSendResult>;
}

export function createWhatsAppProviderStub(providerId: string): WhatsAppProvider {
  return {
    providerId,
    channelType: "WHATSAPP",
    isAvailable: () => false,
    sendMessage: async () => providerNotConfigured(providerId),
    sendWhatsApp: async () => providerNotConfigured(providerId),
  };
}

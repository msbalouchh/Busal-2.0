import type {
  BaseCommunicationProvider,
  CommunicationSendResult,
} from "@/services/communications/interfaces/base-communication-provider.interface";
import { providerNotConfigured } from "@/services/communications/interfaces/base-communication-provider.interface";

export interface VoiceProvider extends BaseCommunicationProvider {
  channelType: "VOICE";
  initiateCall(input: { to: string; script: string }): Promise<CommunicationSendResult>;
}

export function createVoiceProviderStub(providerId: string): VoiceProvider {
  return {
    providerId,
    channelType: "VOICE",
    isAvailable: () => false,
    sendMessage: async () => providerNotConfigured(providerId),
    initiateCall: async () => providerNotConfigured(providerId),
  };
}

import type { PlatformChannelType } from "@prisma/client";

import { isMockFallbackAllowed } from "@/lib/production-mode";
import { getCommunicationProviderRegistry } from "@/services/communication-provider-registry.service";
import {
  FcmPushProvider,
  ResendEmailProvider,
  TwilioSmsProvider,
  TwilioWhatsAppProvider,
} from "@/services/communications/providers/production-providers";
import { createNotificationProviderStub } from "@/services/communications/interfaces/notification-provider.interface";
import { createVoiceProviderStub } from "@/services/communications/interfaces/voice-provider.interface";

export const COMMUNICATION_PROVIDER_PLACEHOLDERS = [
  { id: "resend", name: "Resend", channelType: "EMAIL" as PlatformChannelType },
  { id: "twilio", name: "Twilio SMS", channelType: "SMS" as PlatformChannelType },
  { id: "twilio-whatsapp", name: "Twilio WhatsApp", channelType: "WHATSAPP" as PlatformChannelType },
  { id: "firebase-fcm", name: "Firebase Cloud Messaging", channelType: "PUSH" as PlatformChannelType },
  { id: "azure-communication-voice", name: "Azure Communication Voice", channelType: "VOICE" as PlatformChannelType },
  { id: "in-app", name: "In-App Notifications", channelType: "PUSH" as PlatformChannelType },
] as const;

export function bootstrapCommunicationProviders(): void {
  const registry = getCommunicationProviderRegistry();
  registry.register(new ResendEmailProvider());
  registry.register(new TwilioSmsProvider());
  registry.register(new TwilioWhatsAppProvider());
  registry.register(new FcmPushProvider());
  registry.register(createVoiceProviderStub("azure-communication-voice"));
  registry.register(createNotificationProviderStub("in-app"));
}

export function listCommunicationProviders() {
  bootstrapCommunicationProviders();

  return getCommunicationProviderRegistry()
    .list()
    .map((provider) => {
      const placeholder = COMMUNICATION_PROVIDER_PLACEHOLDERS.find(
        (entry) => entry.id === provider.providerId,
      );
      return {
        id: provider.providerId,
        name: placeholder?.name ?? provider.providerId,
        channelType: placeholder?.channelType ?? provider.channelType,
        available: provider.isAvailable(),
        simulated: !provider.isAvailable() && isMockFallbackAllowed(),
      };
    });
}

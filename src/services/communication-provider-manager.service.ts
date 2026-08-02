import "server-only";

import type { PlatformChannelType } from "@prisma/client";

import { getCommunicationProviderRegistry } from "@/services/communication-provider-registry.service";
import { createEmailProviderStub } from "@/services/communications/interfaces/email-provider.interface";
import { createNotificationProviderStub } from "@/services/communications/interfaces/notification-provider.interface";
import { createPushProviderStub } from "@/services/communications/interfaces/push-provider.interface";
import { createSmsProviderStub } from "@/services/communications/interfaces/sms-provider.interface";
import { createVoiceProviderStub } from "@/services/communications/interfaces/voice-provider.interface";
import { createWhatsAppProviderStub } from "@/services/communications/interfaces/whatsapp-provider.interface";

export const COMMUNICATION_PROVIDER_PLACEHOLDERS = [
  { id: "sendgrid", name: "SendGrid", channelType: "EMAIL" as PlatformChannelType },
  { id: "mailgun", name: "Mailgun", channelType: "EMAIL" as PlatformChannelType },
  { id: "amazon-ses", name: "Amazon SES", channelType: "EMAIL" as PlatformChannelType },
  { id: "twilio", name: "Twilio", channelType: "SMS" as PlatformChannelType },
  { id: "meta-whatsapp", name: "Meta WhatsApp", channelType: "WHATSAPP" as PlatformChannelType },
  {
    id: "firebase-fcm",
    name: "Firebase Cloud Messaging",
    channelType: "PUSH" as PlatformChannelType,
  },
  { id: "onesignal", name: "OneSignal", channelType: "PUSH" as PlatformChannelType },
  {
    id: "azure-communication",
    name: "Azure Communication Services",
    channelType: "SMS" as PlatformChannelType,
  },
] as const;

export function bootstrapCommunicationProviders(): void {
  const registry = getCommunicationProviderRegistry();
  registry.register(createEmailProviderStub("sendgrid"));
  registry.register(createEmailProviderStub("mailgun"));
  registry.register(createEmailProviderStub("amazon-ses"));
  registry.register(createSmsProviderStub("twilio"));
  registry.register(createWhatsAppProviderStub("meta-whatsapp"));
  registry.register(createPushProviderStub("firebase-fcm"));
  registry.register(createPushProviderStub("onesignal"));
  registry.register(createSmsProviderStub("azure-communication"));
  registry.register(createVoiceProviderStub("azure-communication-voice"));
  registry.register(createNotificationProviderStub("in-app"));
}

export function listCommunicationProviders() {
  bootstrapCommunicationProviders();
  return COMMUNICATION_PROVIDER_PLACEHOLDERS.map((provider) => ({
    ...provider,
    available: false,
    simulated: true,
  }));
}

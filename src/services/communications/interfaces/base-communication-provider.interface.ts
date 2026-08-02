import type { PlatformChannelType } from "@prisma/client";

export interface CommunicationSendResult {
  success: boolean;
  simulated: boolean;
  providerReference: string;
  message: string;
}

export interface BaseCommunicationProvider {
  providerId: string;
  channelType: PlatformChannelType;
  isAvailable(): boolean;
  sendMessage(input: {
    recipient: string;
    subject?: string;
    content: string;
    metadata?: Record<string, unknown>;
  }): Promise<CommunicationSendResult>;
}

export function providerNotConfigured(providerId: string): CommunicationSendResult {
  return {
    success: false,
    simulated: true,
    providerReference: "",
    message: `Provider "${providerId}" not configured`,
  };
}

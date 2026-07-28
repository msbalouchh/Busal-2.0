import type { ChannelConnectorDefinition } from "@/modules/communication/types/communication-types";

const connectors = new Map<string, ChannelConnectorDefinition>();

export function registerCommunicationChannel(definition: ChannelConnectorDefinition): void {
  connectors.set(definition.channel, definition);
}

export function listCommunicationChannels(): ChannelConnectorDefinition[] {
  return Array.from(connectors.values());
}

export function getCommunicationChannel(
  channel: ChannelConnectorDefinition["channel"],
): ChannelConnectorDefinition | undefined {
  return connectors.get(channel);
}

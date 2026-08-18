import type { CustomerAiChannel } from "@/modules/customer-ai/types/customer-ai.types";
import type {
  ChannelConnectionCredentials,
  OmnichannelInboundMessage,
  OmnichannelOutboundMessage,
  OutboundDeliveryResult,
} from "@/modules/customer-ai/omnichannel/types/omnichannel.types";

export interface ChannelAdapter {
  channel: CustomerAiChannel;
  parseInbound(input: {
    businessId: string;
    externalAccountId: string;
    payload: Record<string, unknown>;
  }): OmnichannelInboundMessage[];
  buildOutboundPayload(message: OmnichannelOutboundMessage): Record<string, unknown>;
  sendOutbound(input: {
    credentials: ChannelConnectionCredentials;
    message: OmnichannelOutboundMessage;
  }): Promise<OutboundDeliveryResult>;
  resolveExternalAccountId(payload: Record<string, unknown>): string | null;
}

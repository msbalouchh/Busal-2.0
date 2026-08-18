export const OMNICHANNEL_EVENT_TYPES = {
  INBOUND_RECEIVED: "omnichannel.inbound_received",
  OUTBOUND_SENT: "omnichannel.outbound_sent",
  AI_RESPONSE: "omnichannel.ai_response",
  PROVIDER_RESPONSE: "omnichannel.provider_response",
  WEBHOOK_RECEIVED: "omnichannel.webhook_received",
  WEBHOOK_VERIFIED: "omnichannel.webhook_verified",
  DELIVERY_FAILURE: "omnichannel.delivery_failure",
  ESCALATION: "omnichannel.escalation",
  CONNECTION_CONNECTED: "omnichannel.connection_connected",
  CONNECTION_DISCONNECTED: "omnichannel.connection_disconnected",
  CONNECTION_ERROR: "omnichannel.connection_error",
  DUPLICATE_MESSAGE: "omnichannel.duplicate_message",
} as const;

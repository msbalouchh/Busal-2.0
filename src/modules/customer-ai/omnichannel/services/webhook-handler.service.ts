import "server-only";

import { prisma } from "@/lib/prisma";
import { CUSTOMER_AI_CHANNELS } from "@/modules/customer-ai/constants/customer-ai.constants";
import { resolveExternalAccountFromPayload } from "@/modules/customer-ai/omnichannel/adapters/adapter-registry";
import { processChannelWebhookPayload } from "@/modules/customer-ai/omnichannel/services/inbound-message.service";
import { logOmnichannelEvent } from "@/modules/customer-ai/omnichannel/services/channel-observability.service";
import { OMNICHANNEL_EVENT_TYPES } from "@/modules/customer-ai/omnichannel/constants/channel-events";
import {
  parseMetaWebhookChallenge,
  verifyMetaWebhookSignature,
  verifyTwilioWebhookSignature,
  verifyTikTokWebhookSignature,
} from "@/modules/customer-ai/omnichannel/services/webhook-security.service";
import { decryptChannelCredentials } from "@/modules/customer-ai/omnichannel/services/channel-credentials.service";
import type { CustomerAiChannel } from "@/modules/customer-ai/types/customer-ai.types";
import type { ChannelWebhookVerifyResult } from "@/modules/customer-ai/omnichannel/types/omnichannel.types";

export async function handleMetaWebhookVerification(
  verifyToken: string | null,
  challenge: string | null,
): Promise<ChannelWebhookVerifyResult> {
  if (!verifyToken || !challenge) {
    return { type: "rejected", reason: "Missing hub.verify_token or hub.challenge" };
  }

  const connection = await prisma.customerAiChannelConnection.findFirst({
    where: { webhookVerifyToken: verifyToken, status: { not: "DISCONNECTED" } },
  });

  if (!connection) {
    return { type: "rejected", reason: "Unknown verify token" };
  }

  return { type: "challenge", response: challenge };
}

export async function handleMetaChannelWebhook(input: {
  channel: CustomerAiChannel;
  rawBody: string;
  payload: Record<string, unknown>;
  signatureHeader: string | null;
}): Promise<{ status: number; body: unknown }> {
  const externalAccountId = resolveExternalAccountFromPayload(input.channel, "META", input.payload);
  if (!externalAccountId) {
    return { status: 400, body: { error: "Unable to resolve external account from webhook payload" } };
  }

  const connection = await prisma.customerAiChannelConnection.findFirst({
    where: {
      channel: input.channel,
      externalAccountId,
      status: { not: "DISCONNECTED" },
    },
  });

  if (!connection) {
    return { status: 404, body: { error: "Channel connection not found" } };
  }

  const credentials = decryptChannelCredentials(connection.encryptedCredentials);
  const appSecret =
    credentials.appSecret ?? process.env.META_APP_SECRET ?? process.env.FACEBOOK_APP_SECRET;

  if (appSecret && input.signatureHeader) {
    const valid = verifyMetaWebhookSignature(input.rawBody, appSecret, input.signatureHeader);
    if (!valid) {
      return { status: 401, body: { error: "Invalid webhook signature" } };
    }
  }

  await logOmnichannelEvent({
    businessId: connection.businessId,
    channel: input.channel,
    eventType: OMNICHANNEL_EVENT_TYPES.WEBHOOK_RECEIVED,
    connectionId: connection.id,
  });

  const results = await processChannelWebhookPayload({
    channel: input.channel,
    externalAccountId,
    payload: input.payload,
  });

  return { status: 200, body: { success: true, results } };
}

export async function handleTwilioWhatsappWebhook(input: {
  rawBody: string;
  params: Record<string, string>;
  signatureHeader: string | null;
  requestUrl: string;
}): Promise<{ status: number; body: unknown }> {
  const externalAccountId = input.params.To?.replace(/^whatsapp:/, "") ?? "";
  if (!externalAccountId) {
    return { status: 400, body: { error: "Missing To parameter" } };
  }

  const connection = await prisma.customerAiChannelConnection.findFirst({
    where: {
      channel: CUSTOMER_AI_CHANNELS.WHATSAPP,
      externalAccountId,
      provider: "TWILIO",
      status: { not: "DISCONNECTED" },
    },
  });

  if (!connection) {
    return { status: 404, body: { error: "WhatsApp connection not found" } };
  }

  const credentials = decryptChannelCredentials(connection.encryptedCredentials);
  const authToken = credentials.authToken ?? process.env.TWILIO_AUTH_TOKEN;
  if (authToken && input.signatureHeader) {
    const valid = verifyTwilioWebhookSignature(
      input.requestUrl,
      input.params,
      authToken,
      input.signatureHeader,
    );
    if (!valid) {
      return { status: 401, body: { error: "Invalid Twilio signature" } };
    }
  }

  const results = await processChannelWebhookPayload({
    channel: CUSTOMER_AI_CHANNELS.WHATSAPP,
    externalAccountId,
    payload: input.params as unknown as Record<string, unknown>,
  });

  return { status: 200, body: { success: true, results } };
}

export async function handleTikTokWebhook(input: {
  rawBody: string;
  payload: Record<string, unknown>;
  signatureHeader: string | null;
}): Promise<{ status: number; body: unknown }> {
  const externalAccountId = resolveExternalAccountFromPayload(
    CUSTOMER_AI_CHANNELS.TIKTOK,
    "TIKTOK",
    input.payload,
  );
  if (!externalAccountId) {
    return { status: 400, body: { error: "Unable to resolve TikTok business account" } };
  }

  const connection = await prisma.customerAiChannelConnection.findFirst({
    where: {
      channel: CUSTOMER_AI_CHANNELS.TIKTOK,
      externalAccountId,
      status: { not: "DISCONNECTED" },
    },
  });

  if (!connection) {
    return { status: 404, body: { error: "TikTok connection not found" } };
  }

  const credentials = decryptChannelCredentials(connection.encryptedCredentials);
  const secret = credentials.webhookSecret ?? process.env.TIKTOK_WEBHOOK_SECRET;
  if (secret && input.signatureHeader) {
    const valid = verifyTikTokWebhookSignature(input.rawBody, secret, input.signatureHeader);
    if (!valid) {
      return { status: 401, body: { error: "Invalid TikTok webhook signature" } };
    }
  }

  const results = await processChannelWebhookPayload({
    channel: CUSTOMER_AI_CHANNELS.TIKTOK,
    externalAccountId,
    payload: input.payload,
  });

  return { status: 200, body: { success: true, results } };
}

export function metaWebhookGetResponse(searchParams: URLSearchParams): ChannelWebhookVerifyResult {
  const { mode, token, challenge } = parseMetaWebhookChallenge(searchParams);
  if (mode !== "subscribe" || !token || !challenge) {
    return { type: "rejected", reason: "Invalid verification request" };
  }
  return { type: "challenge", response: challenge };
}

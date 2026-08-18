import "server-only";

import type { CustomerAiChannelConnectionStatus, Prisma } from "@prisma/client";
import { randomBytes } from "node:crypto";

import { prisma } from "@/lib/prisma";
import { CUSTOMER_AI_CHANNELS } from "@/modules/customer-ai/constants/customer-ai.constants";
import type { CustomerAiChannel } from "@/modules/customer-ai/types/customer-ai.types";
import {
  decryptChannelCredentials,
  encryptChannelCredentials,
} from "@/modules/customer-ai/omnichannel/services/channel-credentials.service";
import { logOmnichannelEvent } from "@/modules/customer-ai/omnichannel/services/channel-observability.service";
import { OMNICHANNEL_EVENT_TYPES } from "@/modules/customer-ai/omnichannel/constants/channel-events";
import type {
  ChannelConnectionCredentials,
  ChannelConnectionHealth,
  ChannelConnectionSummary,
} from "@/modules/customer-ai/omnichannel/types/omnichannel.types";
import { getMessagingChannel } from "@/modules/customer-ai/channels/messaging-channel-registry";

function mapConnection(row: {
  id: string;
  businessId: string;
  channel: string;
  provider: ChannelConnectionSummary["provider"];
  externalAccountId: string;
  displayName: string | null;
  avatarUrl: string | null;
  status: CustomerAiChannelConnectionStatus;
  webhookVerified: boolean;
  aiEnabled: boolean;
  tokenExpiresAt: Date | null;
  lastHealthCheckAt: Date | null;
  lastSyncAt: Date | null;
  lastError: string | null;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
}): ChannelConnectionSummary {
  return {
    id: row.id,
    businessId: row.businessId,
    channel: row.channel as CustomerAiChannel,
    provider: row.provider,
    externalAccountId: row.externalAccountId,
    displayName: row.displayName,
    avatarUrl: row.avatarUrl,
    status: row.status,
    webhookVerified: row.webhookVerified,
    aiEnabled: row.aiEnabled,
    tokenExpiresAt: row.tokenExpiresAt?.toISOString() ?? null,
    lastHealthCheckAt: row.lastHealthCheckAt?.toISOString() ?? null,
    lastSyncAt: row.lastSyncAt?.toISOString() ?? null,
    lastError: row.lastError,
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listChannelConnectionsForBusiness(
  businessId: string,
): Promise<ChannelConnectionSummary[]> {
  const rows = await prisma.customerAiChannelConnection.findMany({
    where: { businessId },
    orderBy: [{ channel: "asc" }, { updatedAt: "desc" }],
  });
  return rows.map(mapConnection);
}

export async function getChannelConnectionForBusiness(
  businessId: string,
  connectionId: string,
): Promise<ChannelConnectionSummary | null> {
  const row = await prisma.customerAiChannelConnection.findFirst({
    where: { id: connectionId, businessId },
  });
  return row ? mapConnection(row) : null;
}

export async function resolveConnectionByExternalAccount(input: {
  channel: CustomerAiChannel;
  externalAccountId: string;
}): Promise<
  (ChannelConnectionSummary & { encryptedCredentials: string; webhookVerifyToken: string | null }) | null
> {
  const row = await prisma.customerAiChannelConnection.findFirst({
    where: {
      channel: input.channel,
      externalAccountId: input.externalAccountId,
      status: { in: ["CONNECTED", "PENDING", "REQUIRES_REAUTH"] },
    },
  });
  if (!row) return null;
  return {
    ...mapConnection(row),
    encryptedCredentials: row.encryptedCredentials,
    webhookVerifyToken: row.webhookVerifyToken,
  };
}

export async function resolveConnectionCredentials(connectionId: string): Promise<ChannelConnectionCredentials> {
  const row = await prisma.customerAiChannelConnection.findUniqueOrThrow({
    where: { id: connectionId },
    select: { encryptedCredentials: true },
  });
  return decryptChannelCredentials(row.encryptedCredentials);
}

export async function upsertChannelConnection(input: {
  businessId: string;
  channel: CustomerAiChannel;
  provider: ChannelConnectionCredentials["provider"];
  externalAccountId: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  credentials: ChannelConnectionCredentials;
  tokenExpiresAt?: Date | null;
  metadata?: Record<string, unknown>;
}): Promise<ChannelConnectionSummary> {
  const verifyToken = randomBytes(16).toString("hex");
  const encrypted = encryptChannelCredentials(input.credentials);

  const row = await prisma.customerAiChannelConnection.upsert({
    where: {
      channel_externalAccountId: {
        channel: input.channel,
        externalAccountId: input.externalAccountId,
      },
    },
    create: {
      businessId: input.businessId,
      channel: input.channel,
      provider: input.provider,
      externalAccountId: input.externalAccountId,
      displayName: input.displayName ?? null,
      avatarUrl: input.avatarUrl ?? null,
      encryptedCredentials: encrypted,
      tokenExpiresAt: input.tokenExpiresAt ?? null,
      webhookVerifyToken: verifyToken,
      status: "CONNECTED",
      webhookVerified: false,
      metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
      lastSyncAt: new Date(),
    },
    update: {
      displayName: input.displayName ?? undefined,
      avatarUrl: input.avatarUrl ?? undefined,
      encryptedCredentials: encrypted,
      tokenExpiresAt: input.tokenExpiresAt ?? undefined,
      status: "CONNECTED",
      lastError: null,
      lastSyncAt: new Date(),
      metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
    },
  });

  await logOmnichannelEvent({
    businessId: input.businessId,
    channel: input.channel,
    eventType: OMNICHANNEL_EVENT_TYPES.CONNECTION_CONNECTED,
    metadata: { connectionId: row.id, externalAccountId: input.externalAccountId },
  });

  return mapConnection(row);
}

export async function disconnectChannelConnection(
  businessId: string,
  connectionId: string,
): Promise<void> {
  const row = await prisma.customerAiChannelConnection.updateMany({
    where: { id: connectionId, businessId },
    data: { status: "DISCONNECTED", aiEnabled: false },
  });
  if (row.count === 0) throw new Error("Channel connection not found");

  const connection = await prisma.customerAiChannelConnection.findFirst({
    where: { id: connectionId, businessId },
    select: { channel: true },
  });

  await logOmnichannelEvent({
    businessId,
    channel: (connection?.channel ?? "website") as CustomerAiChannel,
    eventType: OMNICHANNEL_EVENT_TYPES.CONNECTION_DISCONNECTED,
    metadata: { connectionId },
  });
}

export async function updateChannelConnectionStatus(
  connectionId: string,
  status: CustomerAiChannelConnectionStatus,
  lastError?: string | null,
): Promise<void> {
  await prisma.customerAiChannelConnection.update({
    where: { id: connectionId },
    data: {
      status,
      lastError: lastError ?? null,
      lastHealthCheckAt: new Date(),
    },
  });
}

export async function markWebhookVerified(connectionId: string): Promise<void> {
  await prisma.customerAiChannelConnection.update({
    where: { id: connectionId },
    data: { webhookVerified: true, lastSyncAt: new Date() },
  });
}

export async function updateChannelAiEnabled(
  businessId: string,
  connectionId: string,
  aiEnabled: boolean,
): Promise<ChannelConnectionSummary> {
  const row = await prisma.customerAiChannelConnection.update({
    where: { id: connectionId, businessId },
    data: { aiEnabled },
  });
  return mapConnection(row);
}

export async function testChannelConnectionHealth(
  businessId: string,
  connectionId: string,
): Promise<ChannelConnectionHealth> {
  const connection = await prisma.customerAiChannelConnection.findFirst({
    where: { id: connectionId, businessId },
  });
  if (!connection) {
    return {
      healthy: false,
      status: "ERROR",
      message: "Connection not found",
      checkedAt: new Date().toISOString(),
    };
  }

  const credentials = decryptChannelCredentials(connection.encryptedCredentials);
  const definition = getMessagingChannel(connection.channel as CustomerAiChannel);
  const missing: string[] = [];

  for (const key of definition?.requiredCredentials ?? []) {
    const envValue = process.env[key];
    const credKey = key.toLowerCase().replace(/_/g, "");
    const hasCred = Boolean(
      envValue ||
        credentials.accessToken ||
        credentials.authToken ||
        credentials.accountSid,
    );
    if (!hasCred && !credentials.accessToken && !credentials.authToken) {
      missing.push(key);
    }
  }

  if (connection.status === "DISCONNECTED") {
    return {
      healthy: false,
      status: connection.status,
      message: "Channel is disconnected",
      checkedAt: new Date().toISOString(),
    };
  }

  if (connection.tokenExpiresAt && connection.tokenExpiresAt.getTime() < Date.now()) {
    await updateChannelConnectionStatus(connectionId, "REQUIRES_REAUTH", "Access token expired");
    return {
      healthy: false,
      status: "REQUIRES_REAUTH",
      message: "Access token expired — reconnect required",
      checkedAt: new Date().toISOString(),
    };
  }

  const healthy = missing.length === 0 && connection.status === "CONNECTED";
  const message = healthy
    ? "Connection credentials present and channel is active"
    : missing.length > 0
      ? `Missing provider configuration: ${missing.join(", ")}`
      : `Connection status: ${connection.status}`;

  await prisma.customerAiChannelConnection.update({
    where: { id: connectionId },
    data: { lastHealthCheckAt: new Date(), lastError: healthy ? null : message },
  });

  return {
    healthy,
    status: connection.status,
    message,
    checkedAt: new Date().toISOString(),
  };
}

export function listOmnichannelTargets(): Array<{
  channel: CustomerAiChannel;
  connected: boolean;
  connection: ChannelConnectionSummary | null;
}> {
  const externalChannels = [
    CUSTOMER_AI_CHANNELS.WHATSAPP,
    CUSTOMER_AI_CHANNELS.INSTAGRAM,
    CUSTOMER_AI_CHANNELS.FACEBOOK,
    CUSTOMER_AI_CHANNELS.TIKTOK,
  ] as const;

  return externalChannels.map((channel) => ({
    channel,
    connected: false,
    connection: null,
  }));
}

export async function listChannelDashboardState(businessId: string): Promise<
  Array<{
    channel: CustomerAiChannel;
    definition: ReturnType<typeof getMessagingChannel>;
    connection: ChannelConnectionSummary | null;
  }>
> {
  const connections = await listChannelConnectionsForBusiness(businessId);
  const externalChannels = [
    CUSTOMER_AI_CHANNELS.WHATSAPP,
    CUSTOMER_AI_CHANNELS.INSTAGRAM,
    CUSTOMER_AI_CHANNELS.FACEBOOK,
    CUSTOMER_AI_CHANNELS.TIKTOK,
  ] as const;

  return externalChannels.map((channel) => ({
    channel,
    definition: getMessagingChannel(channel),
    connection: connections.find((c) => c.channel === channel) ?? null,
  }));
}

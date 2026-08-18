"use server";

import { revalidatePath } from "next/cache";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedAction } from "@/modules/platform-guards/guards/action.guards";
import { CUSTOMER_AI_ROUTES, CUSTOMER_AI_CHANNELS } from "@/modules/customer-ai/constants/customer-ai.constants";
import {
  disconnectChannelConnection,
  listChannelDashboardState,
  testChannelConnectionHealth,
  updateChannelAiEnabled,
  upsertChannelConnection,
} from "@/modules/customer-ai/omnichannel/services/channel-connection.service";
import {
  getChannelAiSettings,
  updateChannelAiSettings,
} from "@/modules/customer-ai/omnichannel/services/channel-settings.service";
import { getChannelCapabilities } from "@/modules/customer-ai/omnichannel/constants/channel-capabilities";
import { getMessagingChannel } from "@/modules/customer-ai/channels/messaging-channel-registry";
import type { CustomerAiChannel } from "@/modules/customer-ai/types/customer-ai.types";
import type { ChannelAiSettings, ChannelConnectionCredentials } from "@/modules/customer-ai/omnichannel/types/omnichannel.types";

export async function getChannelsDashboardAction() {
  return protectedAction(PERMISSION_CODES.AI_VIEW, async ({ platform }) => {
    const businessId = platform.business.id;
    const [channels, settings] = await Promise.all([
      listChannelDashboardState(businessId),
      Promise.all(
        (
          [
            CUSTOMER_AI_CHANNELS.WHATSAPP,
            CUSTOMER_AI_CHANNELS.INSTAGRAM,
            CUSTOMER_AI_CHANNELS.FACEBOOK,
            CUSTOMER_AI_CHANNELS.TIKTOK,
          ] as const
        ).map(async (channel) => ({
          channel,
          settings: await getChannelAiSettings(businessId, channel),
          capabilities: getChannelCapabilities(channel),
          definition: getMessagingChannel(channel),
        })),
      ),
    ]);

    return { channels, channelSettings: settings };
  });
}

export async function connectChannelAction(input: {
  channel: CustomerAiChannel;
  provider: ChannelConnectionCredentials["provider"];
  externalAccountId: string;
  displayName?: string;
  credentials: ChannelConnectionCredentials;
}) {
  return protectedAction(PERMISSION_CODES.AI_AGENT_EDIT, async ({ platform }) => {
    const connection = await upsertChannelConnection({
      businessId: platform.business.id,
      channel: input.channel,
      provider: input.provider,
      externalAccountId: input.externalAccountId,
      displayName: input.displayName,
      credentials: input.credentials,
    });
    revalidatePath(CUSTOMER_AI_ROUTES.channels);
    return connection;
  });
}

export async function disconnectChannelAction(connectionId: string) {
  return protectedAction(PERMISSION_CODES.AI_AGENT_EDIT, async ({ platform }) => {
    await disconnectChannelConnection(platform.business.id, connectionId);
    revalidatePath(CUSTOMER_AI_ROUTES.channels);
    return { success: true };
  });
}

export async function testChannelConnectionAction(connectionId: string) {
  return protectedAction(PERMISSION_CODES.AI_VIEW, async ({ platform }) => {
    return testChannelConnectionHealth(platform.business.id, connectionId);
  });
}

export async function updateChannelAiEnabledAction(connectionId: string, aiEnabled: boolean) {
  return protectedAction(PERMISSION_CODES.AI_AGENT_EDIT, async ({ platform }) => {
    const result = await updateChannelAiEnabled(platform.business.id, connectionId, aiEnabled);
    revalidatePath(CUSTOMER_AI_ROUTES.channels);
    return result;
  });
}

export async function updateChannelSettingsAction(
  channel: CustomerAiChannel,
  settings: Partial<ChannelAiSettings>,
) {
  return protectedAction(PERMISSION_CODES.SETTINGS_EDIT, async ({ platform }) => {
    const result = await updateChannelAiSettings(platform.business.id, channel, settings);
    revalidatePath(CUSTOMER_AI_ROUTES.channels);
    return result;
  });
}

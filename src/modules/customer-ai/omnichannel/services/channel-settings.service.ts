import "server-only";

import { getConfiguration } from "@/services/settings-engine.service";
import { resolveBusinessContextFromModule } from "@/services/ai-engine-context.service";
import { prisma } from "@/lib/prisma";
import type { CustomerAiChannel } from "@/modules/customer-ai/types/customer-ai.types";
import type { ChannelAiSettings } from "@/modules/customer-ai/omnichannel/types/omnichannel.types";

const DEFAULT_SETTINGS: ChannelAiSettings = {
  aiEnabled: true,
  greetingBehavior: "first_message",
  humanEscalationEnabled: true,
  autoEscalateOnFailure: true,
  outsideHoursBehavior: "hours_only",
  allowedCapabilities: [],
  channelMetadata: {},
};

function settingsKey(channel: CustomerAiChannel, suffix: string): string {
  return `ai.customer.channel.${channel}.${suffix}`;
}

export async function getChannelAiSettings(
  businessId: string,
  channel: CustomerAiChannel,
): Promise<ChannelAiSettings> {
  const business = await prisma.business.findUniqueOrThrow({
    where: { id: businessId },
    select: { ownerId: true },
  });
  const platform = await resolveBusinessContextFromModule({
    businessId,
    userId: business.ownerId,
  });

  const [aiEnabled, greeting, escalation, outsideHours, capabilities] = await Promise.all([
    getConfiguration(platform, settingsKey(channel, "ai_enabled")),
    getConfiguration(platform, settingsKey(channel, "greeting_behavior")),
    getConfiguration(platform, settingsKey(channel, "human_escalation")),
    getConfiguration(platform, settingsKey(channel, "outside_hours_behavior")),
    getConfiguration(platform, settingsKey(channel, "allowed_capabilities")),
  ]);

  const connection = await prisma.customerAiChannelConnection.findFirst({
    where: { businessId, channel },
    select: { aiEnabled: true, metadata: true },
  });

  return {
    aiEnabled:
      connection?.aiEnabled ??
      (typeof aiEnabled?.value === "boolean" ? aiEnabled.value : DEFAULT_SETTINGS.aiEnabled),
    greetingBehavior:
      greeting?.value === "always" || greeting?.value === "never" || greeting?.value === "first_message"
        ? greeting.value
        : DEFAULT_SETTINGS.greetingBehavior,
    humanEscalationEnabled:
      typeof escalation?.value === "boolean"
        ? escalation.value
        : DEFAULT_SETTINGS.humanEscalationEnabled,
    autoEscalateOnFailure: DEFAULT_SETTINGS.autoEscalateOnFailure,
    outsideHoursBehavior:
      outsideHours?.value === "normal" ||
      outsideHours?.value === "collect_request" ||
      outsideHours?.value === "hours_only" ||
      outsideHours?.value === "escalate"
        ? outsideHours.value
        : DEFAULT_SETTINGS.outsideHoursBehavior,
    allowedCapabilities: Array.isArray(capabilities?.value)
      ? (capabilities.value as string[])
      : DEFAULT_SETTINGS.allowedCapabilities,
    channelMetadata: (connection?.metadata ?? {}) as Record<string, unknown>,
  };
}

export async function updateChannelAiSettings(
  businessId: string,
  channel: CustomerAiChannel,
  settings: Partial<ChannelAiSettings>,
): Promise<ChannelAiSettings> {
  const connection = await prisma.customerAiChannelConnection.findFirst({
    where: { businessId, channel },
  });

  if (connection && settings.aiEnabled !== undefined) {
    await prisma.customerAiChannelConnection.update({
      where: { id: connection.id },
      data: { aiEnabled: settings.aiEnabled },
    });
  }

  return getChannelAiSettings(businessId, channel);
}

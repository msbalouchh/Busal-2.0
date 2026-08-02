"use server";

import { revalidatePath } from "next/cache";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { COMMUNICATION_PLATFORM_ROUTES } from "@/modules/communication-platform-management/constants/routes";
import { requireCommunicationPlatformActionContext } from "@/modules/communication-platform-management/lib/get-communication-platform-context";
import {
  validateRecipient,
  validateTemplateSlug,
} from "@/modules/communication-platform-management/lib/communication-platform-validation";
import {
  createCommunicationCampaign,
  deleteCommunicationCampaign,
  executeCommunicationCampaign,
} from "@/services/communication-campaign-manager.service";
import {
  createCommunicationChannel,
  deleteCommunicationChannel,
  updateCommunicationChannel,
} from "@/services/communication-channel-manager.service";
import { sendCommunicationMessage } from "@/services/communication-message.service";
import { retryFailedMessages } from "@/services/communication-retry-manager.service";
import {
  createCommunicationTemplate,
  deleteCommunicationTemplate,
  updateCommunicationTemplate,
} from "@/services/communication-template-manager.service";

function revalidateCommunicationPages(): void {
  const routes = [
    COMMUNICATION_PLATFORM_ROUTES.dashboard(),
    COMMUNICATION_PLATFORM_ROUTES.inbox(),
    COMMUNICATION_PLATFORM_ROUTES.templates(),
    COMMUNICATION_PLATFORM_ROUTES.campaigns(),
    COMMUNICATION_PLATFORM_ROUTES.logs(),
    COMMUNICATION_PLATFORM_ROUTES.analytics(),
    COMMUNICATION_PLATFORM_ROUTES.channels(),
    COMMUNICATION_PLATFORM_ROUTES.search(),
  ];
  for (const route of routes) revalidatePath(route);
}

export async function createCommunicationChannelAction(input: {
  name: string;
  type: "EMAIL" | "SMS" | "WHATSAPP" | "PUSH" | "IN_APP" | "VOICE" | "WEBHOOK";
}) {
  const context = await requireCommunicationPlatformActionContext(
    PERMISSION_CODES.COMMUNICATION_CREATE,
  );
  const channel = await createCommunicationChannel(context.user.id, input);
  revalidateCommunicationPages();
  return { id: channel.id, name: channel.name };
}

export async function updateCommunicationChannelAction(
  channelId: string,
  input: { name?: string; status?: "ACTIVE" | "INACTIVE" | "ERROR" },
) {
  const context = await requireCommunicationPlatformActionContext(
    PERMISSION_CODES.COMMUNICATION_MANAGE,
  );
  await updateCommunicationChannel(context.user.id, channelId, input);
  revalidateCommunicationPages();
}

export async function deleteCommunicationChannelAction(channelId: string) {
  const context = await requireCommunicationPlatformActionContext(
    PERMISSION_CODES.COMMUNICATION_DELETE,
  );
  await deleteCommunicationChannel(context.user.id, channelId);
  revalidateCommunicationPages();
}

export async function createCommunicationTemplateAction(input: {
  name: string;
  slug: string;
  channel: "EMAIL" | "SMS" | "WHATSAPP" | "PUSH" | "IN_APP" | "VOICE" | "WEBHOOK";
  subject?: string;
  content: string;
}) {
  const context = await requireCommunicationPlatformActionContext(
    PERMISSION_CODES.COMMUNICATION_CREATE,
  );
  const template = await createCommunicationTemplate(context.user.id, {
    ...input,
    slug: validateTemplateSlug(input.slug),
  });
  revalidateCommunicationPages();
  return { id: template.id, name: template.name };
}

export async function updateCommunicationTemplateAction(
  templateId: string,
  input: {
    name?: string;
    subject?: string;
    content?: string;
    status?: "DRAFT" | "ACTIVE" | "ARCHIVED";
  },
) {
  const context = await requireCommunicationPlatformActionContext(
    PERMISSION_CODES.COMMUNICATION_MANAGE,
  );
  await updateCommunicationTemplate(context.user.id, templateId, input);
  revalidateCommunicationPages();
}

export async function deleteCommunicationTemplateAction(templateId: string) {
  const context = await requireCommunicationPlatformActionContext(
    PERMISSION_CODES.COMMUNICATION_DELETE,
  );
  await deleteCommunicationTemplate(context.user.id, templateId);
  revalidateCommunicationPages();
}

export async function sendCommunicationMessageAction(input: {
  channel: "EMAIL" | "SMS" | "WHATSAPP" | "PUSH" | "IN_APP" | "VOICE" | "WEBHOOK";
  recipient: string;
  subject?: string;
  content: string;
}) {
  const context = await requireCommunicationPlatformActionContext(
    PERMISSION_CODES.COMMUNICATION_SEND,
  );
  const message = await sendCommunicationMessage(context.user.id, {
    ...input,
    recipient: validateRecipient(input.recipient),
  });
  revalidateCommunicationPages();
  return { id: message.id, status: message.status };
}

export async function createCommunicationCampaignAction(input: {
  name: string;
  channel: "EMAIL" | "SMS" | "WHATSAPP" | "PUSH" | "IN_APP" | "VOICE" | "WEBHOOK";
  recipients?: string[];
  subject?: string;
  content?: string;
}) {
  const context = await requireCommunicationPlatformActionContext(
    PERMISSION_CODES.COMMUNICATION_CREATE,
  );
  const campaign = await createCommunicationCampaign(context.user.id, {
    name: input.name,
    channel: input.channel,
    configuration: {
      recipients: input.recipients ?? [],
      subject: input.subject ?? input.name,
      content: input.content ?? "",
    },
  });
  revalidateCommunicationPages();
  return { id: campaign.id, name: campaign.name };
}

export async function executeCommunicationCampaignAction(campaignId: string) {
  const context = await requireCommunicationPlatformActionContext(
    PERMISSION_CODES.COMMUNICATION_SEND,
  );
  await executeCommunicationCampaign(context.user.id, campaignId);
  revalidateCommunicationPages();
}

export async function deleteCommunicationCampaignAction(campaignId: string) {
  const context = await requireCommunicationPlatformActionContext(
    PERMISSION_CODES.COMMUNICATION_DELETE,
  );
  await deleteCommunicationCampaign(context.user.id, campaignId);
  revalidateCommunicationPages();
}

export async function retryFailedMessagesAction() {
  const context = await requireCommunicationPlatformActionContext(
    PERMISSION_CODES.COMMUNICATION_MANAGE,
  );
  const retried = await retryFailedMessages(context.user.id);
  revalidateCommunicationPages();
  return { retried };
}

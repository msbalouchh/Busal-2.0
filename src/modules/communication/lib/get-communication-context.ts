import { cache } from "react";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedPage } from "@/modules/platform-guards/guards/page.guards";
import type { CommunicationInboxType } from "@prisma/client";
import {
  serializeActivityLog,
  serializeAuditLog,
  serializeChannelConnector,
  serializeCommunicationDashboard,
  serializeConversation,
  serializeTimelineMessage,
} from "@/modules/communication/utils/communication-utils";
import {
  ensureCommunicationDefaults,
  getCommunicationDashboard,
  getConversationTimeline,
  listCommunicationAuditLogs,
  listCommunicationChannelConnectors,
  listConversationActivity,
  listInboxConversations,
  searchConversations,
} from "@/services/communication.service";

export const getCommunicationOverviewContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.COMMUNICATION_VIEW });
  await ensureCommunicationDefaults(context.business.id);
  const dashboard = await getCommunicationDashboard(context.business.id);

  return {
    context,
    dashboard: serializeCommunicationDashboard(dashboard),
  };
});

export const getCommunicationInboxContext = cache(
  async (inboxType?: CommunicationInboxType, filter?: string) => {
    const context = await protectedPage({ permission: PERMISSION_CODES.COMMUNICATION_VIEW });
    const conversations = await listInboxConversations(context, {
      inboxType,
      filter: filter as
        | "unread"
        | "assigned"
        | "waiting_customer"
        | "waiting_staff"
        | "ai_handled"
        | "closed"
        | undefined,
    });

    return {
      context,
      conversations: conversations.map(serializeConversation),
    };
  },
);

export const getCommunicationChannelsContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.COMMUNICATION_VIEW });
  const channels = await listCommunicationChannelConnectors(context.business.id);

  return {
    context,
    channels: channels.map(serializeChannelConnector),
  };
});

export const getCommunicationAuditContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.COMMUNICATION_VIEW });
  const auditLogs = await listCommunicationAuditLogs(context.business.id);

  return {
    context,
    auditLogs: auditLogs.map(serializeAuditLog),
  };
});

export const getCommunicationSearchContext = cache(async (query?: string) => {
  const context = await protectedPage({ permission: PERMISSION_CODES.COMMUNICATION_VIEW });
  const conversations = query ? await searchConversations(context, { query }) : [];

  return {
    context,
    conversations: conversations.map(serializeConversation),
  };
});

export const getCommunicationConversationContext = cache(async (conversationId: string) => {
  const context = await protectedPage({ permission: PERMISSION_CODES.COMMUNICATION_VIEW });
  const timeline = await getConversationTimeline(context, conversationId, true);
  const activity = await listConversationActivity(conversationId, context.business.id);

  return {
    context,
    timeline: timeline.map(serializeTimelineMessage),
    activity: activity.map(serializeActivityLog),
  };
});

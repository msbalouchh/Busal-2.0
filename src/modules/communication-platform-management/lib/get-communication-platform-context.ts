import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { ROUTES } from "@/constants/routes";
import { prisma } from "@/lib/prisma";
import { resolveAuthorizationContext } from "@/modules/authorization/services/authorization.service";
import { permissionDenied } from "@/modules/authorization/utils/authorization-errors";
import { requireApplicationAccess } from "@/modules/application-shell/lib/require-application-access";
import { COMMUNICATION_PLATFORM_ROUTES } from "@/modules/communication-platform-management/constants/routes";
import {
  serializeCommunicationAnalytics,
  serializeCommunicationCampaign,
  serializeCommunicationChannel,
  serializeCommunicationMessage,
  serializeCommunicationTemplate,
} from "@/modules/communication-platform-management/lib/communication-platform-validation";
import type { AuthorizationContext } from "@/modules/authorization/types/authorization";
import { getCurrentUser } from "@/services/auth.service";
import { getBusinessByOwnerId } from "@/services/business-profile.service";
import { getCommunicationDashboardSummary } from "@/services/communication-analytics.service";
import { listCommunicationAuditLogs } from "@/services/communication-audit-logger.service";
import { listCommunicationCampaigns } from "@/services/communication-campaign-manager.service";
import { listCommunicationChannels } from "@/services/communication-channel-manager.service";
import {
  getUnifiedInbox,
  listCommunicationMessages,
  searchCommunicationMessages,
} from "@/services/communication-message.service";
import { listCommunicationProviders } from "@/services/communication-provider-manager.service";
import { listCommunicationTemplates } from "@/services/communication-template-manager.service";
import { resolveCommunicationPlatformPermissions } from "@/services/communication-platform-permission.service";
import type { AuthUser } from "@/types/auth";
import type { BusinessProfileData } from "@/types/business-profile";

export interface CommunicationPlatformContext {
  user: AuthUser;
  business: BusinessProfileData & { id: string };
  authorization: AuthorizationContext;
  permissionsFlags: ReturnType<typeof resolveCommunicationPlatformPermissions>;
}

async function resolveCommunicationBusiness(user: AuthUser) {
  const business = await getBusinessByOwnerId(user.id);
  if (!business?.id) throw permissionDenied();
  const authorization = await resolveAuthorizationContext(user, business);
  return { business, authorization };
}

export const getCommunicationPlatformContext = cache(
  async (): Promise<CommunicationPlatformContext> => {
    const user = await requireApplicationAccess();
    const loaded = await resolveCommunicationBusiness(user);
    const permissionsFlags = resolveCommunicationPlatformPermissions(
      loaded.authorization.permissions,
      loaded.authorization.isOwner,
    );

    if (!permissionsFlags.canView) redirect(ROUTES.application);

    return {
      user,
      business: loaded.business,
      authorization: loaded.authorization,
      permissionsFlags,
    };
  },
);

export async function requireCommunicationPlatformActionContext(
  permission: string,
): Promise<CommunicationPlatformContext> {
  const user = await getCurrentUser();
  if (!user) throw permissionDenied();

  const loaded = await resolveCommunicationBusiness(user);
  const permissionsFlags = resolveCommunicationPlatformPermissions(
    loaded.authorization.permissions,
    loaded.authorization.isOwner,
  );

  const allowed = loaded.authorization.isOwner || loaded.authorization.permissions.has(permission);
  if (!allowed) throw permissionDenied();

  return {
    user,
    business: loaded.business,
    authorization: loaded.authorization,
    permissionsFlags,
  };
}

export const getCommunicationDashboardContext = cache(async () => {
  const context = await getCommunicationPlatformContext();
  const summary = await getCommunicationDashboardSummary(context.user.id);
  return {
    ...context,
    analytics: serializeCommunicationAnalytics(summary.analytics),
    messages: summary.recentMessages.map(serializeCommunicationMessage),
  };
});

export const getCommunicationInboxContext = cache(async () => {
  const context = await getCommunicationPlatformContext();
  const messages = await getUnifiedInbox(context.user.id);
  return { ...context, messages: messages.map(serializeCommunicationMessage) };
});

export const getCommunicationTemplatesContext = cache(async () => {
  const context = await getCommunicationPlatformContext();
  const templates = await listCommunicationTemplates(context.user.id);
  return { ...context, templates: templates.map(serializeCommunicationTemplate) };
});

export const getCommunicationCampaignsContext = cache(async () => {
  const context = await getCommunicationPlatformContext();
  const [campaigns, audience] = await Promise.all([
    listCommunicationCampaigns(context.user.id),
    prisma.customer.findMany({
      where: {
        businessId: context.business.id,
        deletedAt: null,
        marketingConsent: true,
        email: { not: null },
      },
      select: { email: true, name: true },
      orderBy: { name: "asc" },
      take: 500,
    }),
  ]);
  return {
    ...context,
    campaigns: campaigns.map(serializeCommunicationCampaign),
    audience: audience
      .map((entry) => ({
        email: entry.email?.trim().toLowerCase() ?? "",
        name: entry.name,
      }))
      .filter((entry) => entry.email.length > 0),
  };
});

export const getCommunicationLogsContext = cache(async () => {
  const context = await getCommunicationPlatformContext();
  const messages = await listCommunicationMessages(context.user.id, { limit: 100 });
  return { ...context, messages: messages.map(serializeCommunicationMessage) };
});

export const getCommunicationAnalyticsContext = cache(async () => {
  const context = await getCommunicationPlatformContext();
  const summary = await getCommunicationDashboardSummary(context.user.id);
  return {
    ...context,
    analytics: serializeCommunicationAnalytics(summary.analytics),
  };
});

export const getCommunicationChannelsContext = cache(async () => {
  const context = await getCommunicationPlatformContext();
  const [channels, providers, auditLogs] = await Promise.all([
    listCommunicationChannels(context.user.id),
    Promise.resolve(listCommunicationProviders()),
    listCommunicationAuditLogs(context.user.id),
  ]);
  return {
    ...context,
    channels: channels.map(serializeCommunicationChannel),
    providers,
    auditLogs,
  };
});

export const getCommunicationSearchContext = cache(async (query?: string) => {
  const context = await getCommunicationPlatformContext();
  const trimmed = query?.trim() ?? "";
  if (!trimmed) {
    return { ...context, search: "", results: { messages: [], templates: [] } };
  }

  const [messages, templates] = await Promise.all([
    searchCommunicationMessages(context.user.id, trimmed),
    listCommunicationTemplates(context.user.id),
  ]);

  const templateMatches = templates
    .filter(
      (template) =>
        template.name.toLowerCase().includes(trimmed.toLowerCase()) ||
        template.slug.toLowerCase().includes(trimmed.toLowerCase()),
    )
    .map(serializeCommunicationTemplate);

  return {
    ...context,
    search: trimmed,
    results: {
      messages: messages.map(serializeCommunicationMessage),
      templates: templateMatches,
    },
  };
});

export const getCommunicationPlatformRoutes = () => COMMUNICATION_PLATFORM_ROUTES;

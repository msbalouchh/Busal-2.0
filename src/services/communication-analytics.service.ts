import "server-only";

import { prisma } from "@/lib/prisma";
import { getOwnedBusinessId } from "@/services/communication-platform-context.service";

export async function getCommunicationAnalytics(ownerId: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  const [total, sent, delivered, failed, queued, campaigns, templates, channels] =
    await Promise.all([
      prisma.platformCommunicationMessage.count({ where: { businessId } }),
      prisma.platformCommunicationMessage.count({ where: { businessId, status: "SENT" } }),
      prisma.platformCommunicationMessage.count({ where: { businessId, status: "DELIVERED" } }),
      prisma.platformCommunicationMessage.count({ where: { businessId, status: "FAILED" } }),
      prisma.platformCommunicationMessage.count({ where: { businessId, status: "QUEUED" } }),
      prisma.platformCommunicationCampaign.count({ where: { businessId } }),
      prisma.platformCommunicationTemplate.count({ where: { businessId } }),
      prisma.platformCommunicationChannel.count({ where: { businessId } }),
    ]);

  const deliveryRate = total > 0 ? Math.round(((delivered + sent) / total) * 100) : 0;

  return {
    totalMessages: total,
    sent,
    delivered,
    failed,
    queued,
    deliveryRate,
    campaigns,
    templates,
    channels,
  };
}

export async function getCommunicationDashboardSummary(ownerId: string) {
  const analytics = await getCommunicationAnalytics(ownerId);
  const businessId = await getOwnedBusinessId(ownerId);
  const recentMessages = await prisma.platformCommunicationMessage.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return { analytics, recentMessages };
}

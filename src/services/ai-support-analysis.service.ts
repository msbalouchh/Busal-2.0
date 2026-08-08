import "server-only";

/** Orchestrates domain AI inference via delegated services. */


import { prisma } from "@/lib/prisma";
import { getCommunicationDashboard } from "@/services/communication.service";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";
import {
  generateTicketInsights,
  getTicketAnalysisSnapshot,
} from "@/services/ai-support-ticket-analysis.service";
import { generateConversationInsights } from "@/services/ai-support-conversation-analysis.service";
import { generatePriorityInsights } from "@/services/ai-support-priority-detection.service";
import { generateIntentRecommendations } from "@/services/ai-support-intent-detection.service";
import {
  generateEscalationInsights,
  generateResponseSuggestions,
} from "@/services/ai-support-escalation-detection.service";
import { generateKnowledgeRecommendations } from "@/services/ai-support-knowledge-recommendation.service";
import {
  generateSatisfactionInsights,
  getSatisfactionSnapshot,
} from "@/services/ai-support-satisfaction.service";
import {
  listSupportInsights,
  listSupportRecommendations,
} from "@/services/ai-support-response-recommendation.service";

export interface SupportAgentDashboardStats {
  totalInsights: number;
  activeInsights: number;
  totalRecommendations: number;
  newRecommendations: number;
  healthScore: number;
  healthLabel: string;
  openTickets: number;
  waitingStaff: number;
  satisfactionScore: number;
  avgResponseTimeHours: number;
}

async function getOwnedBusinessId(ownerId: string): Promise<string> {
  const business = await getOrCreateBusinessForOwner(ownerId);
  return business.id;
}

export function computeSupportHealthScore(input: {
  openTickets: number;
  waitingStaff: number;
  satisfactionScore: number;
  avgResponseTimeHours: number;
  urgentCount: number;
}): { score: number; label: string } {
  let score = input.satisfactionScore;
  score -= Math.min(25, input.openTickets * 2);
  score -= Math.min(20, input.waitingStaff * 4);
  score -= input.avgResponseTimeHours > 4 ? 15 : input.avgResponseTimeHours > 2 ? 8 : 0;
  score -= input.urgentCount * 5;
  score = Math.max(0, Math.min(100, Math.round(score)));

  const label =
    score >= 80 ? "Excellent" : score >= 60 ? "Good" : score >= 40 ? "Fair" : "Needs attention";

  return { score, label };
}

export async function getSupportAgentDashboardStats(
  ownerId: string,
): Promise<SupportAgentDashboardStats> {
  const businessId = await getOwnedBusinessId(ownerId);

  const [insightCounts, recommendationCounts, tickets, satisfaction, comms] = await Promise.all([
    prisma.aISupportInsight.groupBy({
      by: ["status"],
      where: { businessId },
      _count: { _all: true },
    }),
    prisma.aISupportRecommendation.groupBy({
      by: ["status"],
      where: { businessId },
      _count: { _all: true },
    }),
    getTicketAnalysisSnapshot(ownerId),
    getSatisfactionSnapshot(ownerId),
    getCommunicationDashboard(businessId),
  ]);

  const totalInsights = insightCounts.reduce((sum, row) => sum + row._count._all, 0);
  const activeInsights = insightCounts.find((row) => row.status === "ACTIVE")?._count._all ?? 0;
  const totalRecommendations = recommendationCounts.reduce((sum, row) => sum + row._count._all, 0);
  const newRecommendations =
    recommendationCounts.find((row) => row.status === "NEW")?._count._all ?? 0;

  const health = computeSupportHealthScore({
    openTickets: tickets.totalOpen,
    waitingStaff: comms.waitingStaff,
    satisfactionScore: satisfaction.satisfactionScore,
    avgResponseTimeHours: satisfaction.avgResponseTimeHours,
    urgentCount: tickets.urgentCount,
  });

  return {
    totalInsights,
    activeInsights,
    totalRecommendations,
    newRecommendations,
    healthScore: health.score,
    healthLabel: health.label,
    openTickets: tickets.totalOpen,
    waitingStaff: comms.waitingStaff,
    satisfactionScore: satisfaction.satisfactionScore,
    avgResponseTimeHours: satisfaction.avgResponseTimeHours,
  };
}

export async function runSupportAnalysis(
  ownerId: string,
): Promise<{ insightsCreated: number; recommendationsCreated: number }> {
  const results = await Promise.all([
    generateTicketInsights(ownerId),
    generateConversationInsights(ownerId),
    generatePriorityInsights(ownerId),
    generateSatisfactionInsights(ownerId),
    generateEscalationInsights(ownerId),
    generateIntentRecommendations(ownerId),
    generateKnowledgeRecommendations(ownerId),
    generateResponseSuggestions(ownerId),
  ]);

  return {
    insightsCreated: results[0] + results[1] + results[2] + results[3] + results[4],
    recommendationsCreated: results[5] + results[6] + results[7],
  };
}

export async function getSupportAnalysisSummary(ownerId: string) {
  const [stats, insights, recommendations, tickets, satisfaction] = await Promise.all([
    getSupportAgentDashboardStats(ownerId),
    listSupportInsights(ownerId, { pageSize: 5, status: "ACTIVE" }),
    listSupportRecommendations(ownerId, { pageSize: 5, status: "NEW" }),
    getTicketAnalysisSnapshot(ownerId),
    getSatisfactionSnapshot(ownerId),
  ]);

  return { stats, insights, recommendations, tickets, satisfaction };
}

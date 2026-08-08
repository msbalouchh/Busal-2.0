import "server-only";

import { prisma } from "@/lib/prisma";
import { createHrInsight, createHrRecommendation } from "@/services/ai-hr-insight.service";
import { runOwnerDomainInsightTask } from "@/services/ai-domain-insight-runner.service";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";

async function getOwnedBusinessId(ownerId: string): Promise<string> {
  const business = await getOrCreateBusinessForOwner(ownerId);
  return business.id;
}

export interface CandidateEvaluation {
  invitationId: string;
  email: string;
  status: string;
  score: number;
  assessment: string;
  recommendation: string;
}

export async function evaluatePendingCandidates(ownerId: string): Promise<CandidateEvaluation[]> {
  const businessId = await getOwnedBusinessId(ownerId);

  const invitations = await prisma.staffInvitation.findMany({
    where: { businessId, status: { in: ["PENDING", "EXPIRED"] } },
    include: { role: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return invitations.map((invitation) => {
    const daysPending = Math.round(
      (Date.now() - invitation.createdAt.getTime()) / (1000 * 60 * 60 * 24),
    );
    const isExpired = invitation.status === "EXPIRED";
    const score = isExpired ? 0.2 : daysPending > 7 ? 0.4 : 0.7;

    return {
      invitationId: invitation.id,
      email: invitation.email,
      status: invitation.status,
      score,
      assessment: isExpired
        ? "Invitation expired — low likelihood of acceptance without re-engagement."
        : daysPending > 7
          ? "Long-pending invitation — candidate may have lost interest."
          : "Recent invitation — good chance of acceptance with follow-up.",
      recommendation: isExpired
        ? "Re-send invitation with updated role details."
        : "Send reminder email and confirm interest.",
    };
  });
}

export async function generateCandidateRecommendations(ownerId: string): Promise<number> {
  return runOwnerDomainInsightTask(ownerId, {
    module: "hr",
    task: "candidate-recommendations",
    loadContext: async (ownerId) => ({ ownerId }),
    persistInsight: (businessId, insight) =>
      createHrInsight(businessId, {
        title: insight.title,
        description: insight.description,
        category: insight.category ?? "recruitment",
        priority: (insight.priority as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL") ?? "MEDIUM",
        recommendation: insight.recommendation,
        metadata: insight.metadata,
      }),
    persistRecommendation: (businessId, recommendation) =>
      createHrRecommendation(businessId, {
        title: recommendation.title,
        description: recommendation.description,
        action: recommendation.action ?? recommendation.recommendation ?? "Review AI recommendation",
        confidenceScore: recommendation.confidenceScore,
        metadata: recommendation.metadata,
      }),
  });
}

import "server-only";

import { prisma } from "@/lib/prisma";
import { createHrRecommendation } from "@/services/ai-hr-insight.service";
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
  const businessId = await getOwnedBusinessId(ownerId);
  const evaluations = await evaluatePendingCandidates(ownerId);
  let created = 0;

  for (const candidate of evaluations.filter((c) => c.score < 0.6).slice(0, 5)) {
    await createHrRecommendation(businessId, {
      title: `Candidate follow-up: ${candidate.email}`,
      description: candidate.assessment,
      action: candidate.recommendation,
      confidenceScore: candidate.score,
      metadata: { invitationId: candidate.invitationId, type: "candidate_evaluation" },
    });
    created += 1;
  }

  return created;
}

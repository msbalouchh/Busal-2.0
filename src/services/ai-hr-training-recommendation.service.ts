import "server-only";

import { prisma } from "@/lib/prisma";
import { createHrInsight, createHrRecommendation } from "@/services/ai-hr-insight.service";
import { runOwnerDomainInsightTask } from "@/services/ai-domain-insight-runner.service";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";

async function getOwnedBusinessId(ownerId: string): Promise<string> {
  const business = await getOrCreateBusinessForOwner(ownerId);
  return business.id;
}

const TRAINING_BY_DEPARTMENT: Record<string, string> = {
  Kitchen: "Food safety certification and kitchen workflow training",
  Service: "Customer service excellence and upselling techniques",
  HR: "Employment law basics and onboarding procedures",
  Management: "Leadership development and team management",
  default: "Platform onboarding and role-specific skills training",
};

export interface TrainingSuggestion {
  staffId: string;
  name: string;
  reason: string;
  program: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
}

export async function suggestTrainingPrograms(ownerId: string): Promise<TrainingSuggestion[]> {
  const businessId = await getOwnedBusinessId(ownerId);

  const staff = await prisma.staff.findMany({
    where: {
      businessId,
      isActive: true,
      employmentStatus: { in: ["ACTIVE", "PROBATION"] },
    },
    select: {
      id: true,
      fullName: true,
      department: true,
      employmentStatus: true,
      hireDate: true,
      lastLoginAt: true,
    },
    take: 30,
  });

  const suggestions: TrainingSuggestion[] = [];

  for (const member of staff) {
    const dept = member.department ?? "default";
    const program =
      TRAINING_BY_DEPARTMENT[dept] ?? "Platform onboarding and role-specific skills training";

    if (member.employmentStatus === "PROBATION") {
      suggestions.push({
        staffId: member.id,
        name: member.fullName,
        reason: "Employee in probation period",
        program: `Onboarding: ${program}`,
        priority: "HIGH",
      });
      continue;
    }

    const daysSinceHire = member.hireDate
      ? Math.round((Date.now() - member.hireDate.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    if (daysSinceHire !== null && daysSinceHire < 90) {
      suggestions.push({
        staffId: member.id,
        name: member.fullName,
        reason: "New hire within 90 days",
        program,
        priority: "MEDIUM",
      });
    }
  }

  return suggestions.slice(0, 10);
}

export async function generateTrainingRecommendations(ownerId: string): Promise<number> {
  return runOwnerDomainInsightTask(ownerId, {
    module: "hr",
    task: "training-recommendations",
    loadContext: async (ownerId) => ({ ownerId }),
    persistInsight: (businessId, insight) =>
      createHrInsight(businessId, {
        title: insight.title,
        description: insight.description,
        category: insight.category ?? "training",
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

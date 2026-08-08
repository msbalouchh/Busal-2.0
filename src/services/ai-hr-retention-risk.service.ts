import "server-only";

import { prisma } from "@/lib/prisma";
import { createHrInsight, createHrRecommendation } from "@/services/ai-hr-insight.service";
import { runOwnerDomainInsightTask } from "@/services/ai-domain-insight-runner.service";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";

async function getOwnedBusinessId(ownerId: string): Promise<string> {
  const business = await getOrCreateBusinessForOwner(ownerId);
  return business.id;
}

export interface RetentionRiskEmployee {
  staffId: string;
  name: string;
  riskScore: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  factors: string[];
}

export async function identifyAtRiskEmployees(ownerId: string): Promise<RetentionRiskEmployee[]> {
  const businessId = await getOwnedBusinessId(ownerId);
  const inactiveThreshold = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const staff = await prisma.staff.findMany({
    where: {
      businessId,
      isActive: true,
      employmentStatus: { not: "TERMINATED" },
    },
    select: {
      id: true,
      fullName: true,
      employmentStatus: true,
      accountStatus: true,
      lastLoginAt: true,
      hireDate: true,
    },
    take: 50,
  });

  const atRisk: RetentionRiskEmployee[] = [];

  for (const member of staff) {
    const factors: string[] = [];
    let riskScore = 0;

    if (member.employmentStatus === "PROBATION") {
      factors.push("Probation period");
      riskScore += 0.3;
    }
    if (member.accountStatus !== "ACTIVE") {
      factors.push("Account not active");
      riskScore += 0.4;
    }
    if (!member.lastLoginAt || member.lastLoginAt < inactiveThreshold) {
      factors.push("No recent login (30+ days)");
      riskScore += 0.35;
    }
    if (member.employmentStatus === "ON_LEAVE") {
      factors.push("Currently on leave");
      riskScore += 0.2;
    }

    const tenureMonths = member.hireDate
      ? (Date.now() - member.hireDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
      : 0;
    if (tenureMonths >= 12 && tenureMonths <= 18) {
      factors.push("1-year tenure milestone");
      riskScore += 0.15;
    }

    if (riskScore < 0.25) continue;

    const riskLevel: RetentionRiskEmployee["riskLevel"] =
      riskScore >= 0.7
        ? "CRITICAL"
        : riskScore >= 0.5
          ? "HIGH"
          : riskScore >= 0.35
            ? "MEDIUM"
            : "LOW";

    atRisk.push({
      staffId: member.id,
      name: member.fullName,
      riskScore: Math.min(1, riskScore),
      riskLevel,
      factors,
    });
  }

  return atRisk.sort((a, b) => b.riskScore - a.riskScore);
}

export async function generateRetentionInsights(ownerId: string): Promise<number> {
  return runOwnerDomainInsightTask(ownerId, {
    module: "hr",
    task: "retention-insights",
    loadContext: async (ownerId) => ({ ownerId }),
    persistInsight: (businessId, insight) =>
      createHrInsight(businessId, {
        title: insight.title,
        description: insight.description,
        category: insight.category ?? "retention",
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

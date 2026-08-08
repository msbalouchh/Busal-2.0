import "server-only";

import { prisma } from "@/lib/prisma";
import { createHrInsight, createHrRecommendation } from "@/services/ai-hr-insight.service";
import { runOwnerDomainInsightTask } from "@/services/ai-domain-insight-runner.service";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";

async function getOwnedBusinessId(ownerId: string): Promise<string> {
  const business = await getOrCreateBusinessForOwner(ownerId);
  return business.id;
}

export interface ShiftCoverageItem {
  branchId: string | null;
  branchName: string;
  department: string;
  staffCount: number;
  recommendation: string;
}

export async function analyzeShiftCoverage(ownerId: string): Promise<ShiftCoverageItem[]> {
  const businessId = await getOwnedBusinessId(ownerId);

  const staff = await prisma.staff.findMany({
    where: { businessId, isActive: true, employmentStatus: "ACTIVE" },
    select: {
      branchId: true,
      department: true,
      branch: { select: { name: true } },
    },
  });

  const groups = new Map<string, ShiftCoverageItem>();

  for (const member of staff) {
    const dept = member.department ?? "Unassigned";
    const key = `${member.branchId ?? "none"}:${dept}`;
    const existing = groups.get(key);
    if (existing) {
      existing.staffCount += 1;
    } else {
      groups.set(key, {
        branchId: member.branchId,
        branchName: member.branch?.name ?? "All branches",
        department: dept,
        staffCount: 1,
        recommendation: "",
      });
    }
  }

  return Array.from(groups.values())
    .map((group) => ({
      ...group,
      recommendation:
        group.staffCount < 2
          ? "Understaffed — add coverage or cross-train staff."
          : group.staffCount > 8
            ? "Consider splitting into multiple shifts for better coverage."
            : "Adequate coverage — optimize peak/off-peak scheduling.",
    }))
    .sort((a, b) => a.staffCount - b.staffCount);
}

export async function generateShiftRecommendations(ownerId: string): Promise<number> {
  return runOwnerDomainInsightTask(ownerId, {
    module: "hr",
    task: "shift-recommendations",
    loadContext: async (ownerId) => ({ ownerId }),
    persistInsight: (businessId, insight) =>
      createHrInsight(businessId, {
        title: insight.title,
        description: insight.description,
        category: insight.category ?? "shift",
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

import "server-only";

import { prisma } from "@/lib/prisma";
import { createHrInsight, createHrRecommendation } from "@/services/ai-hr-insight.service";
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
  const businessId = await getOwnedBusinessId(ownerId);
  const coverage = await analyzeShiftCoverage(ownerId);
  let created = 0;

  const understaffed = coverage.filter((c) => c.staffCount < 2);
  if (understaffed.length > 0) {
    await createHrInsight(businessId, {
      title: "Shift coverage gaps detected",
      description: `${understaffed.length} department/branch combinations are understaffed.`,
      category: "shift",
      priority: "HIGH",
      recommendation: understaffed.map((c) => `${c.branchName} — ${c.department}`).join(", "),
      metadata: { understaffedCount: understaffed.length },
    });
    created += 1;
  }

  for (const item of understaffed.slice(0, 3)) {
    await createHrRecommendation(businessId, {
      title: `Shift plan: ${item.branchName} / ${item.department}`,
      description: `Only ${item.staffCount} active staff assigned.`,
      action: item.recommendation,
      confidenceScore: 0.8,
      metadata: { branchId: item.branchId, department: item.department },
    });
    created += 1;
  }

  return created;
}

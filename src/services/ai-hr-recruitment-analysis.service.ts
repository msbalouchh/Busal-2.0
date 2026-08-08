import "server-only";

import { prisma } from "@/lib/prisma";
import { createHrInsight } from "@/services/ai-hr-insight.service";
import { runOwnerDomainInsightTask } from "@/services/ai-domain-insight-runner.service";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";

async function getOwnedBusinessId(ownerId: string): Promise<string> {
  const business = await getOrCreateBusinessForOwner(ownerId);
  return business.id;
}

export interface RecruitmentSnapshot {
  pendingInvitations: number;
  expiredInvitations: number;
  acceptedThisMonth: number;
  openHeadcountGap: number;
}

export async function getRecruitmentSnapshot(ownerId: string): Promise<RecruitmentSnapshot> {
  const businessId = await getOwnedBusinessId(ownerId);
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [pendingInvitations, expiredInvitations, acceptedThisMonth, activeStaff, branches] =
    await Promise.all([
      prisma.staffInvitation.count({ where: { businessId, status: "PENDING" } }),
      prisma.staffInvitation.count({ where: { businessId, status: "EXPIRED" } }),
      prisma.staffInvitation.count({
        where: { businessId, status: "ACCEPTED", updatedAt: { gte: monthStart } },
      }),
      prisma.staff.count({ where: { businessId, isActive: true, employmentStatus: "ACTIVE" } }),
      prisma.branch.count({ where: { businessId, isActive: true } }),
    ]);

  const idealPerBranch = 3;
  const openHeadcountGap = Math.max(0, branches * idealPerBranch - activeStaff);

  return {
    pendingInvitations,
    expiredInvitations,
    acceptedThisMonth,
    openHeadcountGap,
  };
}

export async function generateRecruitmentInsights(ownerId: string): Promise<number> {
  return runOwnerDomainInsightTask(ownerId, {
    module: "hr",
    task: "recruitment-insights",
    loadContext: getRecruitmentSnapshot,
    persistInsight: (businessId, insight) =>
      createHrInsight(businessId, {
        title: insight.title,
        description: insight.description,
        category: insight.category ?? "recruitment",
        priority: (insight.priority as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL") ?? "MEDIUM",
        recommendation: insight.recommendation,
        metadata: insight.metadata,
      }),
  });
}

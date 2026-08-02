import "server-only";

import { prisma } from "@/lib/prisma";
import { createHrInsight } from "@/services/ai-hr-insight.service";
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
  const businessId = await getOwnedBusinessId(ownerId);
  const snapshot = await getRecruitmentSnapshot(ownerId);
  let created = 0;

  if (snapshot.pendingInvitations > 0) {
    await createHrInsight(businessId, {
      title: "Pending staff invitations",
      description: `${snapshot.pendingInvitations} invitations awaiting acceptance.`,
      category: "recruitment",
      priority: snapshot.pendingInvitations > 5 ? "HIGH" : "MEDIUM",
      recommendation: "Follow up on pending invitations and resend if needed.",
      metadata: { pending: snapshot.pendingInvitations },
    });
    created += 1;
  }

  if (snapshot.expiredInvitations > 0) {
    await createHrInsight(businessId, {
      title: "Expired invitations need attention",
      description: `${snapshot.expiredInvitations} staff invitations have expired.`,
      category: "recruitment",
      priority: "HIGH",
      recommendation: "Re-issue invitations or remove stale entries from the pipeline.",
      metadata: { expired: snapshot.expiredInvitations },
    });
    created += 1;
  }

  if (snapshot.openHeadcountGap > 0) {
    await createHrInsight(businessId, {
      title: "Headcount gap identified",
      description: `Estimated ${snapshot.openHeadcountGap} additional staff needed for branch coverage.`,
      category: "recruitment",
      priority: snapshot.openHeadcountGap > 5 ? "CRITICAL" : "HIGH",
      recommendation: "Prioritize hiring for understaffed branches and departments.",
      metadata: { gap: snapshot.openHeadcountGap },
    });
    created += 1;
  }

  return created;
}

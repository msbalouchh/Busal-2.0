import "server-only";

import { prisma } from "@/lib/prisma";
import { createHrInsight, createHrRecommendation } from "@/services/ai-hr-insight.service";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";

async function getOwnedBusinessId(ownerId: string): Promise<string> {
  const business = await getOrCreateBusinessForOwner(ownerId);
  return business.id;
}

const INACTIVE_DAYS = 14;

export interface AttendanceSnapshot {
  totalActive: number;
  onLeave: number;
  inactiveLogin: number;
  probation: number;
  lockedAccounts: number;
  leaveRate: number;
  engagementRate: number;
}

export interface LeavePatternItem {
  staffId: string;
  name: string;
  employmentStatus: string;
  daysSinceLogin: number | null;
}

export async function getAttendanceSnapshot(ownerId: string): Promise<AttendanceSnapshot> {
  const businessId = await getOwnedBusinessId(ownerId);
  const now = Date.now();
  const inactiveThreshold = new Date(now - INACTIVE_DAYS * 24 * 60 * 60 * 1000);

  const [totalActive, onLeave, inactiveLogin, probation, lockedAccounts] = await Promise.all([
    prisma.staff.count({ where: { businessId, isActive: true, employmentStatus: "ACTIVE" } }),
    prisma.staff.count({ where: { businessId, employmentStatus: "ON_LEAVE" } }),
    prisma.staff.count({
      where: {
        businessId,
        isActive: true,
        employmentStatus: "ACTIVE",
        OR: [{ lastLoginAt: null }, { lastLoginAt: { lt: inactiveThreshold } }],
      },
    }),
    prisma.staff.count({ where: { businessId, employmentStatus: "PROBATION" } }),
    prisma.staff.count({ where: { businessId, accountStatus: { in: ["LOCKED", "SUSPENDED"] } } }),
  ]);

  const totalStaff = totalActive + onLeave + probation;
  const leaveRate = totalStaff > 0 ? Math.round((onLeave / totalStaff) * 100) : 0;
  const engagementRate =
    totalActive > 0 ? Math.round(((totalActive - inactiveLogin) / totalActive) * 100) : 100;

  return {
    totalActive,
    onLeave,
    inactiveLogin,
    probation,
    lockedAccounts,
    leaveRate,
    engagementRate,
  };
}

export async function analyzeLeavePatterns(ownerId: string): Promise<LeavePatternItem[]> {
  const businessId = await getOwnedBusinessId(ownerId);

  const staff = await prisma.staff.findMany({
    where: {
      businessId,
      employmentStatus: { in: ["ON_LEAVE", "PROBATION"] },
    },
    select: { id: true, fullName: true, employmentStatus: true, lastLoginAt: true },
    take: 20,
  });

  return staff.map((member) => ({
    staffId: member.id,
    name: member.fullName,
    employmentStatus: member.employmentStatus,
    daysSinceLogin: member.lastLoginAt
      ? Math.round((Date.now() - member.lastLoginAt.getTime()) / (1000 * 60 * 60 * 24))
      : null,
  }));
}

export async function generateAttendanceInsights(ownerId: string): Promise<number> {
  const businessId = await getOwnedBusinessId(ownerId);
  const snapshot = await getAttendanceSnapshot(ownerId);
  let created = 0;

  if (snapshot.inactiveLogin > 0) {
    await createHrInsight(businessId, {
      title: "Attendance engagement gap",
      description: `${snapshot.inactiveLogin} active staff have not logged in for ${INACTIVE_DAYS}+ days.`,
      category: "attendance",
      priority: snapshot.inactiveLogin > 3 ? "HIGH" : "MEDIUM",
      recommendation: "Follow up with inactive staff and verify shift assignments.",
      metadata: { inactiveCount: snapshot.inactiveLogin },
    });
    created += 1;
  }

  if (snapshot.onLeave > 0) {
    await createHrInsight(businessId, {
      title: "Leave pattern summary",
      description: `${snapshot.onLeave} employees currently on leave (${snapshot.leaveRate}% of workforce).`,
      category: "leave",
      priority: snapshot.leaveRate > 20 ? "HIGH" : "MEDIUM",
      recommendation: "Review coverage plans and ensure adequate staffing during leave periods.",
      metadata: { onLeave: snapshot.onLeave, leaveRate: snapshot.leaveRate },
    });
    created += 1;
  }

  if (snapshot.lockedAccounts > 0) {
    await createHrRecommendation(businessId, {
      title: "Review locked staff accounts",
      description: `${snapshot.lockedAccounts} accounts are locked or suspended.`,
      action: "Contact affected employees and resolve account access issues.",
      confidenceScore: 0.9,
      metadata: { type: "attendance_account" },
    });
    created += 1;
  }

  return created;
}

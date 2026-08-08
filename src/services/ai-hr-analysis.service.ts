import "server-only";

/** Orchestrates domain AI inference via delegated services. */


import { prisma } from "@/lib/prisma";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";
import {
  generatePerformanceInsights,
  getPerformanceSnapshot,
} from "@/services/ai-hr-performance-analysis.service";
import {
  generateAttendanceInsights,
  getAttendanceSnapshot,
} from "@/services/ai-hr-attendance-analysis.service";
import { generateShiftRecommendations } from "@/services/ai-hr-shift-optimization.service";
import {
  generateRecruitmentInsights,
  getRecruitmentSnapshot,
} from "@/services/ai-hr-recruitment-analysis.service";
import { generateCandidateRecommendations } from "@/services/ai-hr-candidate-evaluation.service";
import { generateTrainingRecommendations } from "@/services/ai-hr-training-recommendation.service";
import {
  generateRetentionInsights,
  identifyAtRiskEmployees,
} from "@/services/ai-hr-retention-risk.service";
import { listHrInsights, listHrRecommendations } from "@/services/ai-hr-insight.service";

export interface HrAgentDashboardStats {
  totalInsights: number;
  activeInsights: number;
  totalRecommendations: number;
  newRecommendations: number;
  healthScore: number;
  healthLabel: string;
  totalActiveStaff: number;
  onLeave: number;
  atRiskCount: number;
  pendingInvitations: number;
  engagementRate: number;
}

async function getOwnedBusinessId(ownerId: string): Promise<string> {
  const business = await getOrCreateBusinessForOwner(ownerId);
  return business.id;
}

export function computeHrHealthScore(input: {
  engagementRate: number;
  atRiskCount: number;
  onLeaveRate: number;
  pendingInvitations: number;
  understaffedDepartments: number;
}): { score: number; label: string } {
  let score = input.engagementRate;
  score -= Math.min(20, input.atRiskCount * 5);
  score -= Math.min(15, input.onLeaveRate);
  score -= Math.min(10, input.pendingInvitations * 2);
  score -= Math.min(15, input.understaffedDepartments * 5);
  score = Math.max(0, Math.min(100, Math.round(score)));

  const label =
    score >= 80 ? "Excellent" : score >= 60 ? "Good" : score >= 40 ? "Fair" : "Needs attention";

  return { score, label };
}

export async function getHrAgentDashboardStats(ownerId: string): Promise<HrAgentDashboardStats> {
  const businessId = await getOwnedBusinessId(ownerId);

  const [insightCounts, recommendationCounts, attendance, recruitment, atRisk, performance] =
    await Promise.all([
      prisma.aIHRInsight.groupBy({
        by: ["status"],
        where: { businessId },
        _count: { _all: true },
      }),
      prisma.aIHRRecommendation.groupBy({
        by: ["status"],
        where: { businessId },
        _count: { _all: true },
      }),
      getAttendanceSnapshot(ownerId),
      getRecruitmentSnapshot(ownerId),
      identifyAtRiskEmployees(ownerId),
      getPerformanceSnapshot(ownerId),
    ]);

  const totalInsights = insightCounts.reduce((sum, row) => sum + row._count._all, 0);
  const activeInsights = insightCounts.find((row) => row.status === "ACTIVE")?._count._all ?? 0;
  const totalRecommendations = recommendationCounts.reduce((sum, row) => sum + row._count._all, 0);
  const newRecommendations =
    recommendationCounts.find((row) => row.status === "NEW")?._count._all ?? 0;

  const health = computeHrHealthScore({
    engagementRate: attendance.engagementRate,
    atRiskCount: atRisk.filter((e) => e.riskLevel === "HIGH" || e.riskLevel === "CRITICAL").length,
    onLeaveRate: attendance.leaveRate,
    pendingInvitations: recruitment.pendingInvitations,
    understaffedDepartments: 0,
  });

  return {
    totalInsights,
    activeInsights,
    totalRecommendations,
    newRecommendations,
    healthScore: health.score,
    healthLabel: health.label,
    totalActiveStaff: performance.totalActiveStaff,
    onLeave: attendance.onLeave,
    atRiskCount: atRisk.length,
    pendingInvitations: recruitment.pendingInvitations,
    engagementRate: attendance.engagementRate,
  };
}

export async function runHrAnalysis(
  ownerId: string,
): Promise<{ insightsCreated: number; recommendationsCreated: number }> {
  const results = await Promise.all([
    generatePerformanceInsights(ownerId),
    generateAttendanceInsights(ownerId),
    generateShiftRecommendations(ownerId),
    generateRecruitmentInsights(ownerId),
    generateRetentionInsights(ownerId),
    generateCandidateRecommendations(ownerId),
    generateTrainingRecommendations(ownerId),
  ]);

  return {
    insightsCreated: results[0] + results[1] + results[2] + results[3] + results[4],
    recommendationsCreated: results[5] + results[6],
  };
}

export async function getHrAnalysisSummary(ownerId: string) {
  const [stats, insights, recommendations, performance, attendance, atRisk] = await Promise.all([
    getHrAgentDashboardStats(ownerId),
    listHrInsights(ownerId, { pageSize: 5, status: "ACTIVE" }),
    listHrRecommendations(ownerId, { pageSize: 5, status: "NEW" }),
    getPerformanceSnapshot(ownerId),
    getAttendanceSnapshot(ownerId),
    identifyAtRiskEmployees(ownerId),
  ]);

  return { stats, insights, recommendations, performance, attendance, atRisk };
}

import "server-only";

import { prisma } from "@/lib/prisma";
import { getEnterpriseTenantId } from "@/services/enterprise-platform-context.service";

export interface ComplianceSummary {
  score: number;
  enabledPolicies: number;
  totalPolicies: number;
  activeProviders: number;
  totalProviders: number;
  categories: Array<{ category: string; enabled: number; total: number }>;
}

export async function getComplianceDashboard(ownerId: string): Promise<ComplianceSummary> {
  const tenantId = await getEnterpriseTenantId(ownerId);

  const [policies, providers] = await Promise.all([
    prisma.platformEnterprisePolicy.findMany({
      where: { organization: { tenantId } },
      select: { category: true, enabled: true },
    }),
    prisma.platformEnterpriseIdentityProvider.findMany({
      where: { organization: { tenantId } },
      select: { status: true },
    }),
  ]);

  const enabledPolicies = policies.filter((p) => p.enabled).length;
  const activeProviders = providers.filter((p) => p.status === "ACTIVE").length;

  const categoryMap = new Map<string, { enabled: number; total: number }>();
  for (const policy of policies) {
    const entry = categoryMap.get(policy.category) ?? { enabled: 0, total: 0 };
    entry.total += 1;
    if (policy.enabled) entry.enabled += 1;
    categoryMap.set(policy.category, entry);
  }

  const policyScore = policies.length > 0 ? (enabledPolicies / policies.length) * 100 : 0;
  const providerScore = providers.length > 0 ? (activeProviders / providers.length) * 100 : 0;
  const score = Math.round((policyScore * 0.7 + providerScore * 0.3) * 10) / 10;

  return {
    score,
    enabledPolicies,
    totalPolicies: policies.length,
    activeProviders,
    totalProviders: providers.length,
    categories: Array.from(categoryMap.entries()).map(([category, counts]) => ({
      category,
      ...counts,
    })),
  };
}

export async function validateComplianceRequirements(ownerId: string): Promise<{
  compliant: boolean;
  gaps: string[];
}> {
  const summary = await getComplianceDashboard(ownerId);
  const gaps: string[] = [];

  if (summary.totalPolicies === 0) gaps.push("No enterprise policies configured");
  if (!summary.categories.some((c) => c.category === "COMPLIANCE" && c.enabled > 0)) {
    gaps.push("No compliance policies enabled");
  }
  if (!summary.categories.some((c) => c.category === "SESSION" && c.enabled > 0)) {
    gaps.push("No session policies enabled");
  }
  if (summary.score < 50) gaps.push("Compliance score below threshold");

  return { compliant: gaps.length === 0, gaps };
}

import "server-only";

import { listRevenueExpenses } from "@/services/revops.service";
import {
  createFinanceInsight,
} from "@/services/ai-finance-recommendation.service";
import { runOwnerDomainInsightTask } from "@/services/ai-domain-insight-runner.service";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";

async function getOwnedBusinessId(ownerId: string): Promise<string> {
  const business = await getOrCreateBusinessForOwner(ownerId);
  return business.id;
}

export interface ExpenseSnapshot {
  totalExpensesPence: number;
  byCategory: Array<{ category: string; totalPence: number; count: number }>;
  topCategory: string | null;
  unusualSpending: Array<{ category: string; amountPence: number; description: string }>;
}

export async function getExpenseSnapshot(ownerId: string): Promise<ExpenseSnapshot> {
  const businessId = await getOwnedBusinessId(ownerId);
  const expenses = await listRevenueExpenses(businessId);

  const categoryMap = new Map<string, { totalPence: number; count: number }>();
  for (const expense of expenses) {
    const existing = categoryMap.get(expense.category) ?? { totalPence: 0, count: 0 };
    existing.totalPence += expense.amountPence;
    existing.count += 1;
    categoryMap.set(expense.category, existing);
  }

  const byCategory = Array.from(categoryMap.entries())
    .map(([category, data]) => ({ category, ...data }))
    .sort((a, b) => b.totalPence - a.totalPence);

  const totalExpensesPence = byCategory.reduce((sum, c) => sum + c.totalPence, 0);
  const avgExpense = expenses.length > 0 ? totalExpensesPence / expenses.length : 0;

  const unusualSpending = expenses
    .filter((e) => e.amountPence > avgExpense * 2)
    .slice(0, 5)
    .map((e) => ({
      category: e.category,
      amountPence: e.amountPence,
      description: e.description ?? "Unspecified expense",
    }));

  return {
    totalExpensesPence,
    byCategory,
    topCategory: byCategory[0]?.category ?? null,
    unusualSpending,
  };
}

export async function generateExpenseInsights(ownerId: string): Promise<number> {
  return runOwnerDomainInsightTask(ownerId, {
    module: "finance",
    task: "expense-insights",
    loadContext: getExpenseSnapshot,
    persistInsight: (businessId, insight) =>
      createFinanceInsight(businessId, {
        title: insight.title,
        description: insight.description,
        category: insight.category ?? "expense",
        priority: (insight.priority as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL") ?? "MEDIUM",
        recommendation: insight.recommendation,
        metadata: insight.metadata,
      }),
  });
}

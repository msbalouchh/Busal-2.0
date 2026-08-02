import "server-only";

import { listRevenueExpenses } from "@/services/revops.service";
import {
  createFinanceInsight,
  createFinanceRecommendation,
} from "@/services/ai-finance-recommendation.service";
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
  const businessId = await getOwnedBusinessId(ownerId);
  const snapshot = await getExpenseSnapshot(ownerId);
  let created = 0;

  if (snapshot.totalExpensesPence > 0) {
    await createFinanceInsight(businessId, {
      title: "Expense overview",
      description: `Total expenses: £${(snapshot.totalExpensesPence / 100).toFixed(2)}. Top category: ${snapshot.topCategory ?? "N/A"}.`,
      category: "expense",
      priority: "MEDIUM",
      recommendation: "Review top spending categories for optimization opportunities.",
      metadata: { totalExpensesPence: snapshot.totalExpensesPence },
    });
    created += 1;
  }

  if (snapshot.unusualSpending.length > 0) {
    await createFinanceInsight(businessId, {
      title: "Unusual spending detected",
      description: `${snapshot.unusualSpending.length} expenses exceed twice the average amount.`,
      category: "expense",
      priority: "HIGH",
      recommendation: "Audit large expenses and verify authorization.",
      metadata: { count: snapshot.unusualSpending.length },
    });
    created += 1;

    for (const item of snapshot.unusualSpending.slice(0, 2)) {
      await createFinanceRecommendation(businessId, {
        title: `Review expense: ${item.category}`,
        description: item.description,
        action: "Verify this expense is authorized and necessary.",
        expectedImpact: `Potential savings up to £${(item.amountPence / 100).toFixed(2)}`,
        confidenceScore: 0.75,
        metadata: { type: "expense_review" },
      });
      created += 1;
    }
  }

  return created;
}

import "server-only";

import { getRevopsDashboard } from "@/services/revops.service";
import { getSalesDashboard } from "@/services/reporting.service";
import { createFinanceInsight } from "@/services/ai-finance-recommendation.service";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";

async function getOwnedBusinessId(ownerId: string): Promise<string> {
  const business = await getOrCreateBusinessForOwner(ownerId);
  return business.id;
}

export interface BudgetSnapshot {
  revenueBudgetPence: number;
  expenseBudgetPence: number;
  actualRevenuePence: number;
  actualExpensesPence: number;
  revenueVariancePercent: number;
  expenseVariancePercent: number;
  budgetStatus: "ON_TRACK" | "OVER_BUDGET" | "UNDER_TARGET";
}

export async function getBudgetSnapshot(ownerId: string): Promise<BudgetSnapshot> {
  const businessId = await getOwnedBusinessId(ownerId);
  const [revops, sales] = await Promise.all([
    getRevopsDashboard(businessId),
    getSalesDashboard(businessId),
  ]);

  const actualRevenuePence = revops.totalCollectedPence + sales.periods.month.grossRevenuePence;
  const actualExpensesPence = revops.totalExpensesPence;
  const revenueBudgetPence = Math.round(actualRevenuePence * 1.1);
  const expenseBudgetPence = Math.round(actualExpensesPence * 0.95);

  const revenueVariancePercent =
    revenueBudgetPence > 0
      ? Math.round(((actualRevenuePence - revenueBudgetPence) / revenueBudgetPence) * 100)
      : 0;
  const expenseVariancePercent =
    expenseBudgetPence > 0
      ? Math.round(((actualExpensesPence - expenseBudgetPence) / expenseBudgetPence) * 100)
      : 0;

  const budgetStatus: BudgetSnapshot["budgetStatus"] =
    actualExpensesPence > expenseBudgetPence
      ? "OVER_BUDGET"
      : actualRevenuePence < revenueBudgetPence * 0.9
        ? "UNDER_TARGET"
        : "ON_TRACK";

  return {
    revenueBudgetPence,
    expenseBudgetPence,
    actualRevenuePence,
    actualExpensesPence,
    revenueVariancePercent,
    expenseVariancePercent,
    budgetStatus,
  };
}

export async function generateBudgetInsights(ownerId: string): Promise<number> {
  const businessId = await getOwnedBusinessId(ownerId);
  const snapshot = await getBudgetSnapshot(ownerId);
  let created = 0;

  await createFinanceInsight(businessId, {
    title: "Budget overview",
    description: `Budget status: ${snapshot.budgetStatus.replace("_", " ")}. Revenue variance: ${snapshot.revenueVariancePercent}%.`,
    category: "budget",
    priority: snapshot.budgetStatus === "OVER_BUDGET" ? "HIGH" : "MEDIUM",
    recommendation:
      snapshot.budgetStatus === "OVER_BUDGET"
        ? "Expenses exceed budget — review discretionary spending."
        : "Continue monitoring actuals against projected budget.",
    metadata: { budgetStatus: snapshot.budgetStatus },
  });
  created += 1;

  return created;
}

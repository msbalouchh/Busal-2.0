import "server-only";

import {
  createFinanceInsight,
  createFinanceRecommendation,
} from "@/services/ai-finance-recommendation.service";
import { getCashFlowSnapshot } from "@/services/ai-finance-cash-flow.service";
import { getProfitabilitySnapshot } from "@/services/ai-finance-profitability.service";
import { getExpenseSnapshot } from "@/services/ai-finance-expense-analysis.service";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";

async function getOwnedBusinessId(ownerId: string): Promise<string> {
  const business = await getOrCreateBusinessForOwner(ownerId);
  return business.id;
}

export interface FinancialRiskAlert {
  id: string;
  title: string;
  description: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  category: string;
  recommendation: string;
}

export async function detectFinancialRisks(ownerId: string): Promise<FinancialRiskAlert[]> {
  const [cashFlow, profitability, expenses] = await Promise.all([
    getCashFlowSnapshot(ownerId),
    getProfitabilitySnapshot(ownerId),
    getExpenseSnapshot(ownerId),
  ]);

  const alerts: FinancialRiskAlert[] = [];

  if (cashFlow.netCashFlowPence < 0) {
    alerts.push({
      id: "negative-cash-flow",
      title: "Negative cash flow",
      description: `Net cash flow is -£${(Math.abs(cashFlow.netCashFlowPence) / 100).toFixed(2)}.`,
      severity: "CRITICAL",
      category: "cash_flow",
      recommendation: "Accelerate collections and reduce non-essential spending immediately.",
    });
  }

  if (cashFlow.overdueInvoices > 0) {
    alerts.push({
      id: "overdue-invoices",
      title: "Overdue invoices",
      description: `${cashFlow.overdueInvoices} invoices are past due.`,
      severity: cashFlow.overdueInvoices > 3 ? "HIGH" : "MEDIUM",
      category: "invoice",
      recommendation: "Escalate collection efforts and review credit terms.",
    });
  }

  if (profitability.profitMarginPercent < 10 && profitability.totalCollectedPence > 0) {
    alerts.push({
      id: "low-margin",
      title: "Low profit margin",
      description: `Profit margin is ${profitability.profitMarginPercent}%.`,
      severity: "HIGH",
      category: "profitability",
      recommendation: "Review pricing strategy and reduce cost of delivery.",
    });
  }

  if (cashFlow.openCollections > 0) {
    alerts.push({
      id: "open-collections",
      title: "Open collection cases",
      description: `${cashFlow.openCollections} collection cases require attention.`,
      severity: "HIGH",
      category: "risk",
      recommendation: "Assign staff to resolve open collection cases.",
    });
  }

  if (expenses.unusualSpending.length >= 3) {
    alerts.push({
      id: "unusual-spending",
      title: "Unusual spending pattern",
      description: `${expenses.unusualSpending.length} expenses exceed normal thresholds.`,
      severity: "MEDIUM",
      category: "expense",
      recommendation: "Audit recent large expenses for fraud or misclassification.",
    });
  }

  return alerts.sort((a, b) => {
    const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    return order[a.severity] - order[b.severity];
  });
}

export async function generateFinancialRiskInsights(ownerId: string): Promise<number> {
  const businessId = await getOwnedBusinessId(ownerId);
  const risks = await detectFinancialRisks(ownerId);
  let created = 0;

  const critical = risks.filter((r) => r.severity === "CRITICAL" || r.severity === "HIGH");
  if (critical.length > 0) {
    await createFinanceInsight(businessId, {
      title: "Financial risk alerts",
      description: `${critical.length} high-priority financial risks detected.`,
      category: "risk",
      priority: "CRITICAL",
      recommendation: critical.map((r) => r.title).join(", "),
      metadata: { riskIds: critical.map((r) => r.id) },
    });
    created += 1;
  }

  for (const risk of critical.slice(0, 3)) {
    await createFinanceRecommendation(businessId, {
      title: risk.title,
      description: risk.description,
      action: risk.recommendation,
      expectedImpact: "Reduce financial exposure",
      confidenceScore: risk.severity === "CRITICAL" ? 0.95 : 0.8,
      metadata: { riskId: risk.id, severity: risk.severity },
    });
    created += 1;
  }

  return created;
}

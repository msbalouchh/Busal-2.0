"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FinanceAgentNav } from "@/modules/ai-finance-agent-management/components/finance-agent-nav";
import type { ExpenseSnapshot } from "@/services/ai-finance-expense-analysis.service";
import type { CostOptimizationOpportunity } from "@/services/ai-finance-cost-optimization.service";

interface FinanceExpensesPanelProps {
  expenses: ExpenseSnapshot;
  costOptimizations: CostOptimizationOpportunity[];
}

export function FinanceExpensesPanel({ expenses, costOptimizations }: FinanceExpensesPanelProps) {
  return (
    <div className="space-y-8">
      <FinanceAgentNav />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Total expenses: £{(expenses.totalExpensesPence / 100).toFixed(2)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {expenses.byCategory.length === 0 ? (
            <p className="text-muted-foreground text-sm">No expense data recorded.</p>
          ) : (
            <ul className="space-y-2">
              {expenses.byCategory.map((item) => (
                <li key={item.category} className="flex justify-between text-sm">
                  <span>{item.category}</span>
                  <span>
                    £{(item.totalPence / 100).toFixed(2)} ({item.count})
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {expenses.unusualSpending.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Unusual spending</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {expenses.unusualSpending.map((item, index) => (
                <li key={index} className="text-sm">
                  <span className="font-medium">{item.category}</span> — £
                  {(item.amountPence / 100).toFixed(2)}: {item.description}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {costOptimizations.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cost optimization opportunities</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {costOptimizations.map((opp) => (
                <li key={opp.area} className="rounded border p-3 text-sm">
                  <p className="font-medium">{opp.area}</p>
                  <p className="text-muted-foreground">{opp.description}</p>
                  <p className="mt-1">{opp.action}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

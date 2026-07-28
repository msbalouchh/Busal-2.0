import type { QuotesDashboardView } from "@/modules/quotes/utils/quote-utils";
import { formatQuoteMoney } from "@/modules/quotes/utils/quote-utils";

interface QuotesDashboardProps {
  dashboard: QuotesDashboardView;
}

export function QuotesDashboard({ dashboard }: QuotesDashboardProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Total Quotes</p>
        <p className="text-2xl font-semibold">{dashboard.totalQuotes}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Pending Approval</p>
        <p className="text-2xl font-semibold">{dashboard.pendingApprovalQuotes}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Proposals</p>
        <p className="text-2xl font-semibold">{dashboard.totalProposals}</p>
        <p className="text-muted-foreground mt-1 text-xs">{dashboard.acceptedProposals} accepted</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Quoted Value</p>
        <p className="text-2xl font-semibold">
          {formatQuoteMoney(dashboard.totalQuotedValuePence)}
        </p>
      </div>
    </div>
  );
}

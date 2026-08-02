import Link from "next/link";

import { COMMERCIAL_PLATFORM_ROUTES } from "@/modules/commercial-platform/constants/commercial-platform";
import { ProposalsList } from "@/modules/quotes/components/quotes-lists";
import { QUOTE_STATUS_LABELS } from "@/modules/quotes/constants/routes";
import type {
  ProposalView,
  QuoteView,
  QuotesDashboardView,
} from "@/modules/quotes/utils/quote-utils";
import { formatQuoteMoney } from "@/modules/quotes/utils/quote-utils";
import type { CommercialPlatformPermissions } from "@/modules/commercial-platform/types/commercial-platform-types";

interface CommercialQuotesPanelProps {
  quotes: QuoteView[];
  proposals: ProposalView[];
  dashboard: QuotesDashboardView;
  permissions: CommercialPlatformPermissions;
}

export function CommercialQuotesPanel({
  quotes,
  proposals,
  dashboard,
  permissions,
}: CommercialQuotesPanelProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border p-4">
          <p className="text-muted-foreground text-sm">Total quotes</p>
          <p className="text-2xl font-semibold">{dashboard.totalQuotes}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-muted-foreground text-sm">Sent quotes</p>
          <p className="text-2xl font-semibold">{dashboard.sentQuotes}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-muted-foreground text-sm">Proposals</p>
          <p className="text-2xl font-semibold">{dashboard.totalProposals}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-muted-foreground text-sm">Quoted value</p>
          <p className="text-2xl font-semibold">
            {formatQuoteMoney(dashboard.totalQuotedValuePence)}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border p-4">
          <h2 className="mb-3 font-semibold">Quotes</h2>
          {quotes.length === 0 ? (
            <p className="text-muted-foreground text-sm">No quotes yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {quotes.slice(0, 8).map((quote) => (
                <li key={quote.id} className="rounded-md border p-3">
                  <div className="flex justify-between gap-3">
                    <span className="font-medium">{quote.quoteNumber}</span>
                    <span className="text-muted-foreground">
                      {QUOTE_STATUS_LABELS[quote.status]}
                    </span>
                  </div>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {quote.opportunityName} ·{" "}
                    {quote.currentVersion ? formatQuoteMoney(quote.currentVersion.totalPence) : "—"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-lg border p-4">
          <h2 className="mb-3 font-semibold">Proposals</h2>
          <ProposalsList proposals={proposals.slice(0, 8)} />
        </div>
      </div>

      {permissions.canManageQuotes ? (
        <Link
          href={COMMERCIAL_PLATFORM_ROUTES.quotesModule}
          className="text-primary text-sm hover:underline"
        >
          Create, edit, send, and export quotes in Quotes module
        </Link>
      ) : null}
    </div>
  );
}

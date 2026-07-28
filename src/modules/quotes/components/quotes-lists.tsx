import {
  PROPOSAL_STATUS_LABELS,
  QUOTE_LINE_TYPE_LABELS,
  QUOTE_STATUS_LABELS,
} from "@/modules/quotes/constants/routes";
import type {
  ProposalTemplateView,
  ProposalView,
  QuoteView,
} from "@/modules/quotes/utils/quote-utils";
import { formatQuoteMoney } from "@/modules/quotes/utils/quote-utils";

export function QuotesList({ quotes }: { quotes: QuoteView[] }) {
  if (quotes.length === 0) {
    return <p className="text-muted-foreground text-sm">No quotes yet.</p>;
  }

  return (
    <ul className="space-y-2 text-sm">
      {quotes.map((quote) => (
        <li key={quote.id} className="rounded-md border p-3">
          <div className="flex justify-between gap-3">
            <span className="font-medium">{quote.quoteNumber}</span>
            <span className="text-muted-foreground">{QUOTE_STATUS_LABELS[quote.status]}</span>
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            {quote.opportunityName} · v{quote.versionCount} ·{" "}
            {quote.currentVersion ? formatQuoteMoney(quote.currentVersion.totalPence) : "—"}
          </p>
          {quote.currentVersion ? (
            <p className="text-muted-foreground mt-1 text-xs">
              {quote.currentVersion.lineItems.length} line items · One-time{" "}
              {formatQuoteMoney(quote.currentVersion.oneTimeTotalPence)} · Recurring{" "}
              {formatQuoteMoney(quote.currentVersion.recurringTotalPence)}
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export function QuoteBuilderSummary({ quote }: { quote: QuoteView }) {
  if (!quote.currentVersion) {
    return null;
  }

  const version = quote.currentVersion;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <p className="text-muted-foreground text-sm">Subtotal</p>
          <p className="text-xl font-semibold">{formatQuoteMoney(version.subtotalPence)}</p>
        </div>
        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <p className="text-muted-foreground text-sm">Tax</p>
          <p className="text-xl font-semibold">{formatQuoteMoney(version.taxPence)}</p>
        </div>
        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <p className="text-muted-foreground text-sm">Total</p>
          <p className="text-xl font-semibold">{formatQuoteMoney(version.totalPence)}</p>
        </div>
      </div>
      <ul className="space-y-2 text-sm">
        {version.lineItems.map((line) => (
          <li key={line.id} className="rounded-md border p-3">
            <div className="flex justify-between gap-3">
              <span className="font-medium">
                {line.customName ?? line.productName ?? line.bundleName ?? "Line item"}
              </span>
              <span>{formatQuoteMoney(line.lineTotalPence)}</span>
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              {QUOTE_LINE_TYPE_LABELS[line.lineType]} · Qty {line.quantity} ·{" "}
              {line.billingCycle.replace("_", " ").toLowerCase()}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ProposalTemplatesList({ templates }: { templates: ProposalTemplateView[] }) {
  if (templates.length === 0) {
    return <p className="text-muted-foreground text-sm">No proposal templates yet.</p>;
  }

  return (
    <ul className="space-y-2 text-sm">
      {templates.map((template) => (
        <li key={template.id} className="rounded-md border p-3">
          <div className="flex justify-between gap-3">
            <span className="font-medium">{template.name}</span>
            <span className="text-muted-foreground">{template.slug}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function ProposalsList({ proposals }: { proposals: ProposalView[] }) {
  if (proposals.length === 0) {
    return <p className="text-muted-foreground text-sm">No proposals yet.</p>;
  }

  return (
    <ul className="space-y-2 text-sm">
      {proposals.map((proposal) => (
        <li key={proposal.id} className="rounded-md border p-3">
          <div className="flex justify-between gap-3">
            <span className="font-medium">
              {proposal.currentVersion?.title ?? proposal.quoteNumber}
            </span>
            <span className="text-muted-foreground">{PROPOSAL_STATUS_LABELS[proposal.status]}</span>
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            Quote {proposal.quoteNumber} · v{proposal.versionCount} · {proposal.viewCount} views
            {proposal.acceptance?.status === "ACCEPTED" ? " · Accepted" : ""}
          </p>
        </li>
      ))}
    </ul>
  );
}

export function PublicProposalView({
  proposal,
  quote,
}: {
  proposal: ProposalView;
  quote: QuoteView;
}) {
  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">{proposal.currentVersion?.title ?? "Proposal"}</h1>
        <p className="text-muted-foreground text-sm">Quote {quote.quoteNumber}</p>
      </div>
      {proposal.currentVersion?.introduction ? (
        <p className="text-sm">{proposal.currentVersion.introduction}</p>
      ) : null}
      {quote.currentVersion ? <QuoteBuilderSummary quote={quote} /> : null}
      {proposal.currentVersion?.terms ? (
        <div className="rounded-md border p-4 text-sm">
          <h2 className="mb-2 font-medium">Terms</h2>
          <p className="text-muted-foreground whitespace-pre-wrap">
            {proposal.currentVersion.terms}
          </p>
        </div>
      ) : null}
      {proposal.acceptance?.status === "ACCEPTED" ? (
        <p className="text-sm font-medium text-green-700">
          Accepted by {proposal.acceptance.acceptedByName}
        </p>
      ) : null}
    </div>
  );
}

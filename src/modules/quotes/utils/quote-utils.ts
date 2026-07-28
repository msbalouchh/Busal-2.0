import { formatMoneyPence } from "@/modules/payments/utils/currency";
import type {
  ProposalData,
  ProposalTemplateData,
  QuoteData,
  QuotesDashboardData,
} from "@/services/quotes-proposals.service";

export function formatQuoteMoney(pence: number): string {
  return formatMoneyPence(pence);
}

export type QuotesDashboardView = QuotesDashboardData;
export type QuoteView = QuoteData;
export type ProposalView = ProposalData;
export type ProposalTemplateView = ProposalTemplateData;

export function serializeQuotesDashboard(dashboard: QuotesDashboardData): QuotesDashboardView {
  return dashboard;
}

export function serializeQuote(quote: QuoteData): QuoteView {
  return quote;
}

export function serializeProposal(proposal: ProposalData): ProposalView {
  return proposal;
}

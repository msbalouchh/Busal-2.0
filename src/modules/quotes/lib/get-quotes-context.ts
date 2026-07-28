import { cache } from "react";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedPage } from "@/modules/platform-guards/guards/page.guards";
import {
  serializeProposal,
  serializeQuote,
  serializeQuotesDashboard,
} from "@/modules/quotes/utils/quote-utils";
import {
  getQuotesDashboard,
  listProposalTemplates,
  listProposals,
  listQuotes,
} from "@/services/quotes-proposals.service";

export const getQuotesOverviewContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.QUOTES_VIEW });
  const dashboard = await getQuotesDashboard(context.business.id);

  return {
    context,
    dashboard: serializeQuotesDashboard(dashboard),
  };
});

export const getQuotesListContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.QUOTES_VIEW });
  const quotes = await listQuotes(context.business.id);

  return {
    context,
    quotes: quotes.map(serializeQuote),
  };
});

export const getProposalTemplatesContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.PROPOSALS_MANAGE });
  const templates = await listProposalTemplates(context.business.id);

  return { context, templates };
});

export const getProposalsListContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.QUOTES_VIEW });
  const proposals = await listProposals(context.business.id);

  return {
    context,
    proposals: proposals.map(serializeProposal),
  };
});

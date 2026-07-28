"use server";

import { revalidatePath } from "next/cache";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedAction } from "@/modules/platform-guards/guards/action.guards";
import { QUOTES_ROUTES } from "@/modules/quotes/constants/routes";
import type { QuoteLineType } from "@prisma/client";
import {
  acceptProposal,
  createProposalRevision,
  createProposalTemplate,
  createQuote,
  createQuoteRevision,
  generateProposalFromQuote,
  rejectProposal,
  requestQuoteApproval,
  reviewQuoteApproval,
  sendProposal,
  sendQuote,
} from "@/services/quotes-proposals.service";

function revalidateQuotesPaths() {
  Object.values(QUOTES_ROUTES).forEach((path) => {
    revalidatePath(path);
  });
}

export async function createQuoteAction(input: {
  opportunityId: string;
  title: string;
  notes?: string | null;
  discountPence?: number;
  taxRateBps?: number;
  lineItems: Array<{
    lineType: QuoteLineType;
    productVersionId?: string | null;
    bundleVersionId?: string | null;
    customName?: string | null;
    customDescription?: string | null;
    quantity?: number;
    unitPricePence: number;
    lineDiscountPence?: number;
    taxRateBps?: number;
    billingCycle?: "ONE_TIME" | "MONTHLY" | "ANNUAL";
    sortOrder?: number;
  }>;
}) {
  return protectedAction(PERMISSION_CODES.QUOTES_CREATE, async ({ business, platform }) => {
    const quote = await createQuote(business.id, platform.staffSession?.staffId ?? null, input);
    revalidateQuotesPaths();
    return { success: true as const, quoteId: quote.id };
  });
}

export async function createQuoteRevisionAction(
  quoteId: string,
  input: Parameters<typeof createQuoteAction>[0],
) {
  return protectedAction(PERMISSION_CODES.QUOTES_EDIT, async ({ business, platform }) => {
    await createQuoteRevision(quoteId, business.id, platform.staffSession?.staffId ?? null, input);
    revalidateQuotesPaths();
    return { success: true as const };
  });
}

export async function requestQuoteApprovalAction(quoteId: string, requestNotes?: string | null) {
  return protectedAction(PERMISSION_CODES.QUOTES_EDIT, async ({ business, platform }) => {
    await requestQuoteApproval(
      quoteId,
      business.id,
      platform.staffSession?.staffId ?? null,
      requestNotes,
    );
    revalidateQuotesPaths();
    return { success: true as const };
  });
}

export async function reviewQuoteApprovalAction(
  quoteId: string,
  input: { approved: boolean; reviewNotes?: string | null },
) {
  return protectedAction(PERMISSION_CODES.QUOTES_APPROVE, async ({ business, platform }) => {
    await reviewQuoteApproval(quoteId, business.id, platform.staffSession?.staffId ?? null, input);
    revalidateQuotesPaths();
    return { success: true as const };
  });
}

export async function sendQuoteAction(quoteId: string, sentToEmail: string) {
  return protectedAction(PERMISSION_CODES.QUOTES_SEND, async ({ business, platform }) => {
    await sendQuote(quoteId, business.id, platform.staffSession?.staffId ?? null, sentToEmail);
    revalidateQuotesPaths();
    return { success: true as const };
  });
}

export async function createProposalTemplateAction(input: {
  name: string;
  introduction?: string | null;
  termsTemplate?: string | null;
  footerTemplate?: string | null;
}) {
  return protectedAction(PERMISSION_CODES.PROPOSALS_MANAGE, async ({ business, platform }) => {
    const template = await createProposalTemplate(
      business.id,
      platform.staffSession?.staffId ?? null,
      input,
    );
    revalidateQuotesPaths();
    return { success: true as const, templateId: template.id };
  });
}

export async function generateProposalAction(input: {
  quoteId: string;
  templateId?: string | null;
  title?: string;
}) {
  return protectedAction(PERMISSION_CODES.PROPOSALS_MANAGE, async ({ business, platform }) => {
    const proposal = await generateProposalFromQuote(
      business.id,
      platform.staffSession?.staffId ?? null,
      input,
    );
    revalidateQuotesPaths();
    return { success: true as const, proposalId: proposal.id };
  });
}

export async function createProposalRevisionAction(proposalId: string, title?: string) {
  return protectedAction(PERMISSION_CODES.PROPOSALS_MANAGE, async ({ business, platform }) => {
    await createProposalRevision(
      proposalId,
      business.id,
      platform.staffSession?.staffId ?? null,
      title ? { title } : undefined,
    );
    revalidateQuotesPaths();
    return { success: true as const };
  });
}

export async function sendProposalAction(proposalId: string, sentToEmail: string) {
  return protectedAction(PERMISSION_CODES.QUOTES_SEND, async ({ business, platform }) => {
    await sendProposal(
      proposalId,
      business.id,
      platform.staffSession?.staffId ?? null,
      sentToEmail,
    );
    revalidateQuotesPaths();
    return { success: true as const };
  });
}

export async function acceptProposalAction(
  deliveryToken: string,
  input: { acceptedByName: string; acceptedByEmail: string; signatureNotes?: string | null },
) {
  return protectedAction(PERMISSION_CODES.QUOTES_ACCEPT, async () => {
    await acceptProposal(deliveryToken, input);
    revalidateQuotesPaths();
    return { success: true as const };
  });
}

export async function rejectProposalAction(
  deliveryToken: string,
  input: { acceptedByName: string; acceptedByEmail: string; signatureNotes?: string | null },
) {
  return protectedAction(PERMISSION_CODES.QUOTES_ACCEPT, async () => {
    await rejectProposal(deliveryToken, input);
    revalidateQuotesPaths();
    return { success: true as const };
  });
}

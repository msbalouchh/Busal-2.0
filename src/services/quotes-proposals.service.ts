import "server-only";

import { randomUUID } from "node:crypto";

import type {
  Prisma,
  ProposalAcceptanceStatus,
  ProposalStatus,
  QuoteApprovalStatus,
  QuoteBillingCycle,
  QuoteLineType,
  QuoteStatus,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { runInteractiveTransaction } from "@/lib/prisma-transaction";
import { calculateQuotePricing } from "@/modules/quotes/utils/pricing-engine";
import { logQuoteAudit } from "@/modules/quotes/utils/quote-audit";

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export interface QuoteLineItemInput {
  lineType: QuoteLineType;
  productVersionId?: string | null;
  bundleVersionId?: string | null;
  customName?: string | null;
  customDescription?: string | null;
  quantity?: number;
  unitPricePence: number;
  lineDiscountPence?: number;
  taxRateBps?: number;
  billingCycle?: QuoteBillingCycle;
  sortOrder?: number;
}

export interface QuoteLineItemData {
  id: string;
  lineType: QuoteLineType;
  productVersionId: string | null;
  productName: string | null;
  bundleVersionId: string | null;
  bundleName: string | null;
  customName: string | null;
  customDescription: string | null;
  quantity: number;
  unitPricePence: number;
  lineDiscountPence: number;
  taxRateBps: number;
  billingCycle: QuoteBillingCycle;
  sortOrder: number;
  lineNetPence: number;
  lineTaxPence: number;
  lineTotalPence: number;
}

export interface QuoteVersionData {
  id: string;
  versionNumber: number;
  title: string;
  notes: string | null;
  subtotalPence: number;
  discountPence: number;
  taxPence: number;
  recurringTotalPence: number;
  oneTimeTotalPence: number;
  totalPence: number;
  taxRateBps: number;
  lineItems: QuoteLineItemData[];
  createdAt: Date;
}

export interface QuoteData {
  id: string;
  businessId: string;
  opportunityId: string;
  opportunityName: string;
  quoteNumber: string;
  status: QuoteStatus;
  currency: string;
  validUntil: Date | null;
  sentAt: Date | null;
  sentToEmail: string | null;
  deliveryToken: string | null;
  currentVersion: QuoteVersionData | null;
  versionCount: number;
}

export interface QuoteApprovalData {
  id: string;
  quoteId: string;
  status: QuoteApprovalStatus;
  requestNotes: string | null;
  reviewNotes: string | null;
  createdAt: Date;
  reviewedAt: Date | null;
}

export interface ProposalTemplateData {
  id: string;
  businessId: string;
  name: string;
  slug: string;
  introduction: string | null;
  termsTemplate: string | null;
  footerTemplate: string | null;
  isActive: boolean;
}

export interface ProposalVersionData {
  id: string;
  versionNumber: number;
  title: string;
  introduction: string | null;
  terms: string | null;
  footer: string | null;
  quoteVersionId: string;
  createdAt: Date;
}

export interface ProposalViewHistoryData {
  id: string;
  viewerEmail: string | null;
  viewedAt: Date;
}

export interface ProposalAcceptanceData {
  id: string;
  status: ProposalAcceptanceStatus;
  acceptedByName: string | null;
  acceptedByEmail: string | null;
  signatureNotes: string | null;
  acceptedAt: Date | null;
}

export interface ProposalData {
  id: string;
  businessId: string;
  quoteId: string;
  quoteNumber: string;
  templateId: string | null;
  templateName: string | null;
  status: ProposalStatus;
  sentAt: Date | null;
  sentToEmail: string | null;
  deliveryToken: string | null;
  preparedContractId: string | null;
  currentVersion: ProposalVersionData | null;
  versionCount: number;
  viewCount: number;
  acceptance: ProposalAcceptanceData | null;
}

export interface QuotesDashboardData {
  totalQuotes: number;
  draftQuotes: number;
  pendingApprovalQuotes: number;
  sentQuotes: number;
  totalProposals: number;
  acceptedProposals: number;
  totalQuotedValuePence: number;
}

type QuoteVersionWithItems = Prisma.QuoteVersionGetPayload<{
  include: {
    lineItems: {
      include: {
        productVersion: true;
        bundleVersion: true;
      };
    };
  };
}>;

function mapLineItem(
  line: QuoteVersionWithItems["lineItems"][number],
  pricingLine?: { lineNetPence: number; lineTaxPence: number; lineTotalPence: number },
): QuoteLineItemData {
  const lineNetPence =
    pricingLine?.lineNetPence ?? line.quantity * line.unitPricePence - line.lineDiscountPence;
  const lineTaxPence =
    pricingLine?.lineTaxPence ?? Math.round((lineNetPence * line.taxRateBps) / 10000);

  return {
    id: line.id,
    lineType: line.lineType,
    productVersionId: line.productVersionId,
    productName: line.productVersion?.name ?? null,
    bundleVersionId: line.bundleVersionId,
    bundleName: line.bundleVersion?.name ?? null,
    customName: line.customName,
    customDescription: line.customDescription,
    quantity: line.quantity,
    unitPricePence: line.unitPricePence,
    lineDiscountPence: line.lineDiscountPence,
    taxRateBps: line.taxRateBps,
    billingCycle: line.billingCycle,
    sortOrder: line.sortOrder,
    lineNetPence,
    lineTaxPence,
    lineTotalPence: pricingLine?.lineTotalPence ?? lineNetPence + lineTaxPence,
  };
}

function mapQuoteVersion(version: QuoteVersionWithItems): QuoteVersionData {
  const pricing = calculateQuotePricing({
    lineItems: version.lineItems.map((line) => ({
      lineType: line.lineType,
      quantity: line.quantity,
      unitPricePence: line.unitPricePence,
      lineDiscountPence: line.lineDiscountPence,
      taxRateBps: line.taxRateBps,
      billingCycle: line.billingCycle,
    })),
    quoteDiscountPence: version.discountPence,
    defaultTaxRateBps: version.taxRateBps,
  });

  return {
    id: version.id,
    versionNumber: version.versionNumber,
    title: version.title,
    notes: version.notes,
    subtotalPence: version.subtotalPence,
    discountPence: version.discountPence,
    taxPence: version.taxPence,
    recurringTotalPence: version.recurringTotalPence,
    oneTimeTotalPence: version.oneTimeTotalPence,
    totalPence: version.totalPence,
    taxRateBps: version.taxRateBps,
    lineItems: version.lineItems.map((line, index) => mapLineItem(line, pricing.lineItems[index])),
    createdAt: version.createdAt,
  };
}

async function validateLineItemCatalogueLink(
  businessId: string,
  line: QuoteLineItemInput,
): Promise<void> {
  if (line.lineType === "CUSTOM") {
    if (!line.customName?.trim()) {
      throw new Error("Custom line items require a name");
    }
    return;
  }

  if (line.lineType === "BUNDLE") {
    if (!line.bundleVersionId) {
      throw new Error("Bundle version is required for bundle line items");
    }
    const bundleVersion = await prisma.commercialBundleVersion.findFirst({
      where: { id: line.bundleVersionId, bundle: { businessId } },
    });
    if (!bundleVersion) {
      throw new Error("Bundle version not found");
    }
    return;
  }

  if (!line.productVersionId) {
    throw new Error("Product version is required for catalogue line items");
  }

  const productVersion = await prisma.commercialProductVersion.findFirst({
    where: { id: line.productVersionId, product: { businessId } },
  });
  if (!productVersion) {
    throw new Error("Product version not found");
  }
}

async function nextQuoteNumber(businessId: string): Promise<string> {
  const count = await prisma.quote.count({ where: { businessId } });
  const year = new Date().getFullYear();
  return `Q-${year}-${String(count + 1).padStart(4, "0")}`;
}

async function loadQuote(quoteId: string, businessId: string): Promise<QuoteData> {
  const quote = await prisma.quote.findFirst({
    where: { id: quoteId, businessId, deletedAt: null },
    include: {
      opportunity: true,
      currentVersion: {
        include: {
          lineItems: {
            include: { productVersion: true, bundleVersion: true },
            orderBy: { sortOrder: "asc" },
          },
        },
      },
      _count: { select: { versions: true } },
    },
  });

  if (!quote) {
    throw new Error("Quote not found");
  }

  return {
    id: quote.id,
    businessId: quote.businessId,
    opportunityId: quote.opportunityId,
    opportunityName: quote.opportunity.name,
    quoteNumber: quote.quoteNumber,
    status: quote.status,
    currency: quote.currency,
    validUntil: quote.validUntil,
    sentAt: quote.sentAt,
    sentToEmail: quote.sentToEmail,
    deliveryToken: quote.deliveryToken,
    currentVersion: quote.currentVersion ? mapQuoteVersion(quote.currentVersion) : null,
    versionCount: quote._count.versions,
  };
}

export async function createQuote(
  businessId: string,
  staffId: string | null,
  input: {
    opportunityId: string;
    title: string;
    notes?: string | null;
    currency?: string;
    validUntil?: Date | null;
    discountPence?: number;
    taxRateBps?: number;
    lineItems: QuoteLineItemInput[];
  },
): Promise<QuoteData> {
  const opportunity = await prisma.salesOpportunity.findFirst({
    where: { id: input.opportunityId, businessId, deletedAt: null },
  });
  if (!opportunity) {
    throw new Error("Opportunity not found");
  }

  for (const line of input.lineItems) {
    await validateLineItemCatalogueLink(businessId, line);
  }

  const pricing = calculateQuotePricing({
    lineItems: input.lineItems.map((line) => ({
      lineType: line.lineType,
      quantity: line.quantity ?? 1,
      unitPricePence: line.unitPricePence,
      lineDiscountPence: line.lineDiscountPence,
      taxRateBps: line.taxRateBps,
      billingCycle: line.billingCycle,
    })),
    quoteDiscountPence: input.discountPence,
    defaultTaxRateBps: input.taxRateBps,
  });

  const quoteNumber = await nextQuoteNumber(businessId);

  const quote = await runInteractiveTransaction(async (tx) => {
    const created = await tx.quote.create({
      data: {
        businessId,
        opportunityId: input.opportunityId,
        quoteNumber,
        currency: input.currency ?? "GBP",
        validUntil: input.validUntil ?? null,
        versions: {
          create: {
            versionNumber: 1,
            title: input.title.trim(),
            notes: input.notes ?? null,
            subtotalPence: pricing.subtotalPence,
            discountPence: pricing.discountPence,
            taxPence: pricing.taxPence,
            recurringTotalPence: pricing.recurringTotalPence,
            oneTimeTotalPence: pricing.oneTimeTotalPence,
            totalPence: pricing.totalPence,
            taxRateBps: pricing.taxRateBps,
            createdByStaffId: staffId,
            lineItems: {
              create: input.lineItems.map((line, index) => ({
                lineType: line.lineType,
                productVersionId: line.productVersionId ?? null,
                bundleVersionId: line.bundleVersionId ?? null,
                customName: line.customName ?? null,
                customDescription: line.customDescription ?? null,
                quantity: line.quantity ?? 1,
                unitPricePence: line.unitPricePence,
                lineDiscountPence: line.lineDiscountPence ?? 0,
                taxRateBps: line.taxRateBps ?? pricing.taxRateBps,
                billingCycle: line.billingCycle ?? "ONE_TIME",
                sortOrder: line.sortOrder ?? index,
              })),
            },
          },
        },
      },
      include: {
        versions: { orderBy: { versionNumber: "desc" }, take: 1 },
      },
    });

    const version = created.versions[0];
    if (!version) {
      throw new Error("Quote version was not created");
    }
    await tx.quote.update({
      where: { id: created.id },
      data: { currentVersionId: version.id },
    });

    await tx.salesOpportunity.update({
      where: { id: input.opportunityId },
      data: { preparedQuoteId: created.id },
    });

    await logQuoteAudit(
      businessId,
      { staffId, entityType: "quote", entityId: created.id, action: "created" },
      tx,
    );

    return created.id;
  });

  return loadQuote(quote, businessId);
}

export async function createQuoteRevision(
  quoteId: string,
  businessId: string,
  staffId: string | null,
  input: {
    title: string;
    notes?: string | null;
    discountPence?: number;
    taxRateBps?: number;
    lineItems: QuoteLineItemInput[];
  },
): Promise<QuoteData> {
  const existing = await prisma.quote.findFirst({
    where: { id: quoteId, businessId, deletedAt: null },
    include: { versions: { orderBy: { versionNumber: "desc" }, take: 1 } },
  });
  if (!existing) {
    throw new Error("Quote not found");
  }

  for (const line of input.lineItems) {
    await validateLineItemCatalogueLink(businessId, line);
  }

  const nextVersionNumber = (existing.versions[0]?.versionNumber ?? 0) + 1;
  const pricing = calculateQuotePricing({
    lineItems: input.lineItems.map((line) => ({
      lineType: line.lineType,
      quantity: line.quantity ?? 1,
      unitPricePence: line.unitPricePence,
      lineDiscountPence: line.lineDiscountPence,
      taxRateBps: line.taxRateBps,
      billingCycle: line.billingCycle,
    })),
    quoteDiscountPence: input.discountPence,
    defaultTaxRateBps: input.taxRateBps ?? existing.versions[0]?.taxRateBps,
  });

  await runInteractiveTransaction(async (tx) => {
    const version = await tx.quoteVersion.create({
      data: {
        quoteId,
        versionNumber: nextVersionNumber,
        title: input.title.trim(),
        notes: input.notes ?? null,
        subtotalPence: pricing.subtotalPence,
        discountPence: pricing.discountPence,
        taxPence: pricing.taxPence,
        recurringTotalPence: pricing.recurringTotalPence,
        oneTimeTotalPence: pricing.oneTimeTotalPence,
        totalPence: pricing.totalPence,
        taxRateBps: pricing.taxRateBps,
        createdByStaffId: staffId,
        lineItems: {
          create: input.lineItems.map((line, index) => ({
            lineType: line.lineType,
            productVersionId: line.productVersionId ?? null,
            bundleVersionId: line.bundleVersionId ?? null,
            customName: line.customName ?? null,
            customDescription: line.customDescription ?? null,
            quantity: line.quantity ?? 1,
            unitPricePence: line.unitPricePence,
            lineDiscountPence: line.lineDiscountPence ?? 0,
            taxRateBps: line.taxRateBps ?? pricing.taxRateBps,
            billingCycle: line.billingCycle ?? "ONE_TIME",
            sortOrder: line.sortOrder ?? index,
          })),
        },
      },
    });

    await tx.quote.update({
      where: { id: quoteId },
      data: { currentVersionId: version.id, status: "DRAFT" },
    });

    await logQuoteAudit(
      businessId,
      {
        staffId,
        entityType: "quote",
        entityId: quoteId,
        action: "revision_created",
        metadata: { versionNumber: nextVersionNumber },
      },
      tx,
    );
  });

  return loadQuote(quoteId, businessId);
}

export async function getQuote(quoteId: string, businessId: string): Promise<QuoteData> {
  return loadQuote(quoteId, businessId);
}

export async function listQuotes(businessId: string): Promise<QuoteData[]> {
  const quotes = await prisma.quote.findMany({
    where: { businessId, deletedAt: null },
    include: {
      opportunity: true,
      currentVersion: {
        include: {
          lineItems: {
            include: { productVersion: true, bundleVersion: true },
            orderBy: { sortOrder: "asc" },
          },
        },
      },
      _count: { select: { versions: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return quotes.map((quote) => ({
    id: quote.id,
    businessId: quote.businessId,
    opportunityId: quote.opportunityId,
    opportunityName: quote.opportunity.name,
    quoteNumber: quote.quoteNumber,
    status: quote.status,
    currency: quote.currency,
    validUntil: quote.validUntil,
    sentAt: quote.sentAt,
    sentToEmail: quote.sentToEmail,
    deliveryToken: quote.deliveryToken,
    currentVersion: quote.currentVersion ? mapQuoteVersion(quote.currentVersion) : null,
    versionCount: quote._count.versions,
  }));
}

export async function listQuoteVersions(
  quoteId: string,
  businessId: string,
): Promise<QuoteVersionData[]> {
  const quote = await prisma.quote.findFirst({
    where: { id: quoteId, businessId, deletedAt: null },
  });
  if (!quote) {
    throw new Error("Quote not found");
  }

  const versions = await prisma.quoteVersion.findMany({
    where: { quoteId },
    include: {
      lineItems: {
        include: { productVersion: true, bundleVersion: true },
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { versionNumber: "desc" },
  });

  return versions.map(mapQuoteVersion);
}

export async function requestQuoteApproval(
  quoteId: string,
  businessId: string,
  staffId: string | null,
  requestNotes?: string | null,
): Promise<QuoteApprovalData> {
  const quote = await prisma.quote.findFirst({
    where: { id: quoteId, businessId, deletedAt: null },
  });
  if (!quote) {
    throw new Error("Quote not found");
  }

  const approval = await runInteractiveTransaction(async (tx) => {
    await tx.quote.update({
      where: { id: quoteId },
      data: { status: "PENDING_APPROVAL" },
    });

    const created = await tx.quoteApproval.create({
      data: {
        quoteId,
        requestedByStaffId: staffId,
        requestNotes: requestNotes ?? null,
      },
    });

    await logQuoteAudit(
      businessId,
      { staffId, entityType: "quote", entityId: quoteId, action: "approval_requested" },
      tx,
    );

    return created;
  });

  return {
    id: approval.id,
    quoteId: approval.quoteId,
    status: approval.status,
    requestNotes: approval.requestNotes,
    reviewNotes: approval.reviewNotes,
    createdAt: approval.createdAt,
    reviewedAt: approval.reviewedAt,
  };
}

export async function reviewQuoteApproval(
  quoteId: string,
  businessId: string,
  staffId: string | null,
  input: { approved: boolean; reviewNotes?: string | null },
): Promise<QuoteData> {
  const approval = await prisma.quoteApproval.findFirst({
    where: { quoteId, status: "PENDING" },
    orderBy: { createdAt: "desc" },
  });
  if (!approval) {
    throw new Error("No pending approval found");
  }

  const quote = await prisma.quote.findFirst({
    where: { id: quoteId, businessId },
  });
  if (!quote) {
    throw new Error("Quote not found");
  }

  await runInteractiveTransaction(async (tx) => {
    await tx.quoteApproval.update({
      where: { id: approval.id },
      data: {
        status: input.approved ? "APPROVED" : "REJECTED",
        reviewedByStaffId: staffId,
        reviewNotes: input.reviewNotes ?? null,
        reviewedAt: new Date(),
      },
    });

    await tx.quote.update({
      where: { id: quoteId },
      data: { status: input.approved ? "APPROVED" : "REJECTED" },
    });

    await logQuoteAudit(
      businessId,
      {
        staffId,
        entityType: "quote",
        entityId: quoteId,
        action: input.approved ? "approved" : "rejected",
      },
      tx,
    );
  });

  return loadQuote(quoteId, businessId);
}

export async function sendQuote(
  quoteId: string,
  businessId: string,
  staffId: string | null,
  sentToEmail: string,
): Promise<QuoteData> {
  const quote = await prisma.quote.findFirst({
    where: { id: quoteId, businessId, deletedAt: null },
  });
  if (!quote) {
    throw new Error("Quote not found");
  }
  if (quote.status !== "APPROVED") {
    throw new Error("Quote must be approved before sending");
  }

  const deliveryToken = quote.deliveryToken ?? randomUUID();

  await runInteractiveTransaction(async (tx) => {
    await tx.quote.update({
      where: { id: quoteId },
      data: {
        status: "SENT",
        sentAt: new Date(),
        sentToEmail,
        deliveryToken,
      },
    });

    await logQuoteAudit(
      businessId,
      {
        staffId,
        entityType: "quote",
        entityId: quoteId,
        action: "sent",
        metadata: { sentToEmail },
      },
      tx,
    );
  });

  return loadQuote(quoteId, businessId);
}

export async function acceptQuote(
  quoteId: string,
  businessId: string,
  input: { acceptedByName: string; acceptedByEmail: string; signatureNotes?: string | null },
): Promise<QuoteData> {
  const quote = await prisma.quote.findFirst({
    where: { id: quoteId, businessId, deletedAt: null },
  });
  if (!quote) {
    throw new Error("Quote not found");
  }

  await runInteractiveTransaction(async (tx) => {
    await tx.quote.update({
      where: { id: quoteId },
      data: { status: "ACCEPTED" },
    });

    await logQuoteAudit(
      businessId,
      {
        entityType: "quote",
        entityId: quoteId,
        action: "accepted",
        metadata: { acceptedByEmail: input.acceptedByEmail },
      },
      tx,
    );
  });

  return loadQuote(quoteId, businessId);
}

export async function createProposalTemplate(
  businessId: string,
  staffId: string | null,
  input: {
    name: string;
    introduction?: string | null;
    termsTemplate?: string | null;
    footerTemplate?: string | null;
  },
): Promise<ProposalTemplateData> {
  const template = await prisma.proposalTemplate.create({
    data: {
      businessId,
      name: input.name.trim(),
      slug: slugify(input.name),
      introduction: input.introduction ?? null,
      termsTemplate: input.termsTemplate ?? null,
      footerTemplate: input.footerTemplate ?? null,
    },
  });

  await logQuoteAudit(businessId, {
    staffId,
    entityType: "proposal_template",
    entityId: template.id,
    action: "created",
  });

  return {
    id: template.id,
    businessId: template.businessId,
    name: template.name,
    slug: template.slug,
    introduction: template.introduction,
    termsTemplate: template.termsTemplate,
    footerTemplate: template.footerTemplate,
    isActive: template.isActive,
  };
}

export async function listProposalTemplates(businessId: string): Promise<ProposalTemplateData[]> {
  const templates = await prisma.proposalTemplate.findMany({
    where: { businessId, isActive: true },
    orderBy: { name: "asc" },
  });

  return templates.map((template) => ({
    id: template.id,
    businessId: template.businessId,
    name: template.name,
    slug: template.slug,
    introduction: template.introduction,
    termsTemplate: template.termsTemplate,
    footerTemplate: template.footerTemplate,
    isActive: template.isActive,
  }));
}

async function loadProposal(proposalId: string, businessId: string): Promise<ProposalData> {
  const proposal = await prisma.proposal.findFirst({
    where: { id: proposalId, businessId },
    include: {
      quote: true,
      template: true,
      currentVersion: true,
      acceptance: true,
      _count: { select: { versions: true, viewHistory: true } },
    },
  });

  if (!proposal) {
    throw new Error("Proposal not found");
  }

  return {
    id: proposal.id,
    businessId: proposal.businessId,
    quoteId: proposal.quoteId,
    quoteNumber: proposal.quote.quoteNumber,
    templateId: proposal.templateId,
    templateName: proposal.template?.name ?? null,
    status: proposal.status,
    sentAt: proposal.sentAt,
    sentToEmail: proposal.sentToEmail,
    deliveryToken: proposal.deliveryToken,
    preparedContractId: proposal.preparedContractId,
    currentVersion: proposal.currentVersion
      ? {
          id: proposal.currentVersion.id,
          versionNumber: proposal.currentVersion.versionNumber,
          title: proposal.currentVersion.title,
          introduction: proposal.currentVersion.introduction,
          terms: proposal.currentVersion.terms,
          footer: proposal.currentVersion.footer,
          quoteVersionId: proposal.currentVersion.quoteVersionId,
          createdAt: proposal.currentVersion.createdAt,
        }
      : null,
    versionCount: proposal._count.versions,
    viewCount: proposal._count.viewHistory,
    acceptance: proposal.acceptance
      ? {
          id: proposal.acceptance.id,
          status: proposal.acceptance.status,
          acceptedByName: proposal.acceptance.acceptedByName,
          acceptedByEmail: proposal.acceptance.acceptedByEmail,
          signatureNotes: proposal.acceptance.signatureNotes,
          acceptedAt: proposal.acceptance.acceptedAt,
        }
      : null,
  };
}

export async function generateProposalFromQuote(
  businessId: string,
  staffId: string | null,
  input: {
    quoteId: string;
    templateId?: string | null;
    title?: string;
  },
): Promise<ProposalData> {
  const quote = await prisma.quote.findFirst({
    where: { id: input.quoteId, businessId, deletedAt: null },
    include: {
      currentVersion: {
        include: {
          lineItems: {
            include: { productVersion: true, bundleVersion: true },
            orderBy: { sortOrder: "asc" },
          },
        },
      },
    },
  });
  if (!quote?.currentVersion) {
    throw new Error("Quote version not found");
  }

  const template = input.templateId
    ? await prisma.proposalTemplate.findFirst({
        where: { id: input.templateId, businessId, isActive: true },
      })
    : null;

  const quoteSnapshot = mapQuoteVersion(quote.currentVersion);

  const proposalId = await runInteractiveTransaction(async (tx) => {
    const proposal = await tx.proposal.create({
      data: {
        businessId,
        quoteId: quote.id,
        templateId: template?.id ?? null,
        versions: {
          create: {
            versionNumber: 1,
            title: input.title ?? quote.currentVersion!.title,
            introduction: template?.introduction ?? null,
            terms: template?.termsTemplate ?? null,
            footer: template?.footerTemplate ?? null,
            quoteVersionId: quote.currentVersion!.id,
            quoteSnapshot: quoteSnapshot as unknown as Prisma.InputJsonValue,
            createdByStaffId: staffId,
          },
        },
        acceptance: { create: {} },
      },
      include: { versions: { take: 1 } },
    });

    const proposalVersion = proposal.versions[0];
    if (!proposalVersion) {
      throw new Error("Proposal version was not created");
    }

    await tx.proposal.update({
      where: { id: proposal.id },
      data: { currentVersionId: proposalVersion.id },
    });

    await tx.salesOpportunity.update({
      where: { id: quote.opportunityId },
      data: { preparedProposalId: proposal.id },
    });

    await logQuoteAudit(
      businessId,
      {
        staffId,
        entityType: "proposal",
        entityId: proposal.id,
        action: "generated",
        metadata: { quoteId: quote.id },
      },
      tx,
    );

    return proposal.id;
  });

  return loadProposal(proposalId, businessId);
}

export async function createProposalRevision(
  proposalId: string,
  businessId: string,
  staffId: string | null,
  input?: { title?: string },
): Promise<ProposalData> {
  const proposal = await prisma.proposal.findFirst({
    where: { id: proposalId, businessId },
    include: {
      quote: {
        include: {
          currentVersion: {
            include: {
              lineItems: {
                include: { productVersion: true, bundleVersion: true },
                orderBy: { sortOrder: "asc" },
              },
            },
          },
        },
      },
      versions: { orderBy: { versionNumber: "desc" }, take: 1 },
      template: true,
    },
  });
  if (!proposal?.quote.currentVersion) {
    throw new Error("Proposal not found");
  }

  const nextVersionNumber = (proposal.versions[0]?.versionNumber ?? 0) + 1;
  const quoteSnapshot = mapQuoteVersion(proposal.quote.currentVersion);

  await runInteractiveTransaction(async (tx) => {
    const version = await tx.proposalVersion.create({
      data: {
        proposalId,
        versionNumber: nextVersionNumber,
        title: input?.title ?? proposal.quote.currentVersion!.title,
        introduction: proposal.template?.introduction ?? proposal.versions[0]?.introduction,
        terms: proposal.template?.termsTemplate ?? proposal.versions[0]?.terms,
        footer: proposal.template?.footerTemplate ?? proposal.versions[0]?.footer,
        quoteVersionId: proposal.quote.currentVersion!.id,
        quoteSnapshot: quoteSnapshot as unknown as Prisma.InputJsonValue,
        createdByStaffId: staffId,
      },
    });

    await tx.proposal.update({
      where: { id: proposalId },
      data: { currentVersionId: version.id, status: "DRAFT" },
    });

    await logQuoteAudit(
      businessId,
      {
        staffId,
        entityType: "proposal",
        entityId: proposalId,
        action: "revision_created",
        metadata: { versionNumber: nextVersionNumber },
      },
      tx,
    );
  });

  return loadProposal(proposalId, businessId);
}

export async function sendProposal(
  proposalId: string,
  businessId: string,
  staffId: string | null,
  sentToEmail: string,
): Promise<ProposalData> {
  const proposal = await prisma.proposal.findFirst({
    where: { id: proposalId, businessId },
  });
  if (!proposal) {
    throw new Error("Proposal not found");
  }

  const deliveryToken = proposal.deliveryToken ?? randomUUID();

  await runInteractiveTransaction(async (tx) => {
    await tx.proposal.update({
      where: { id: proposalId },
      data: {
        status: "SENT",
        sentAt: new Date(),
        sentToEmail,
        deliveryToken,
      },
    });

    await logQuoteAudit(
      businessId,
      {
        staffId,
        entityType: "proposal",
        entityId: proposalId,
        action: "sent",
        metadata: { sentToEmail },
      },
      tx,
    );
  });

  return loadProposal(proposalId, businessId);
}

export async function recordProposalView(
  deliveryToken: string,
  input?: { viewerEmail?: string | null; viewerIp?: string | null; userAgent?: string | null },
): Promise<ProposalData> {
  const proposal = await prisma.proposal.findFirst({
    where: { deliveryToken },
  });
  if (!proposal) {
    throw new Error("Proposal not found");
  }

  await runInteractiveTransaction(async (tx) => {
    await tx.proposalViewHistory.create({
      data: {
        proposalId: proposal.id,
        viewerEmail: input?.viewerEmail ?? null,
        viewerIp: input?.viewerIp ?? null,
        userAgent: input?.userAgent ?? null,
      },
    });

    if (proposal.status === "SENT") {
      await tx.proposal.update({
        where: { id: proposal.id },
        data: { status: "VIEWED" },
      });
    }
  });

  return loadProposal(proposal.id, proposal.businessId);
}

export async function acceptProposal(
  deliveryToken: string,
  input: { acceptedByName: string; acceptedByEmail: string; signatureNotes?: string | null },
): Promise<ProposalData> {
  const proposal = await prisma.proposal.findFirst({
    where: { deliveryToken },
  });
  if (!proposal) {
    throw new Error("Proposal not found");
  }

  await runInteractiveTransaction(async (tx) => {
    await tx.proposalAcceptance.update({
      where: { proposalId: proposal.id },
      data: {
        status: "ACCEPTED",
        acceptedByName: input.acceptedByName,
        acceptedByEmail: input.acceptedByEmail,
        signatureNotes: input.signatureNotes ?? null,
        acceptedAt: new Date(),
      },
    });

    await tx.proposal.update({
      where: { id: proposal.id },
      data: { status: "ACCEPTED" },
    });

    await tx.quote.update({
      where: { id: proposal.quoteId },
      data: { status: "ACCEPTED" },
    });

    await logQuoteAudit(
      proposal.businessId,
      {
        entityType: "proposal",
        entityId: proposal.id,
        action: "accepted",
        metadata: { acceptedByEmail: input.acceptedByEmail },
      },
      tx,
    );
  });

  return loadProposal(proposal.id, proposal.businessId);
}

export async function rejectProposal(
  deliveryToken: string,
  input: { acceptedByName: string; acceptedByEmail: string; signatureNotes?: string | null },
): Promise<ProposalData> {
  const proposal = await prisma.proposal.findFirst({
    where: { deliveryToken },
  });
  if (!proposal) {
    throw new Error("Proposal not found");
  }

  await runInteractiveTransaction(async (tx) => {
    await tx.proposalAcceptance.update({
      where: { proposalId: proposal.id },
      data: {
        status: "REJECTED",
        acceptedByName: input.acceptedByName,
        acceptedByEmail: input.acceptedByEmail,
        signatureNotes: input.signatureNotes ?? null,
      },
    });

    await tx.proposal.update({
      where: { id: proposal.id },
      data: { status: "REJECTED" },
    });

    await logQuoteAudit(
      proposal.businessId,
      {
        entityType: "proposal",
        entityId: proposal.id,
        action: "rejected",
        metadata: { acceptedByEmail: input.acceptedByEmail },
      },
      tx,
    );
  });

  return loadProposal(proposal.id, proposal.businessId);
}

export async function getProposalByToken(deliveryToken: string): Promise<{
  proposal: ProposalData;
  quote: QuoteData;
}> {
  const proposal = await prisma.proposal.findFirst({
    where: { deliveryToken },
    include: {
      quote: {
        include: {
          opportunity: true,
          currentVersion: {
            include: {
              lineItems: {
                include: { productVersion: true, bundleVersion: true },
                orderBy: { sortOrder: "asc" },
              },
            },
          },
          _count: { select: { versions: true } },
        },
      },
      template: true,
      currentVersion: true,
      acceptance: true,
      _count: { select: { versions: true, viewHistory: true } },
    },
  });

  if (!proposal) {
    throw new Error("Proposal not found");
  }

  const quote = proposal.quote;

  return {
    proposal: {
      id: proposal.id,
      businessId: proposal.businessId,
      quoteId: proposal.quoteId,
      quoteNumber: quote.quoteNumber,
      templateId: proposal.templateId,
      templateName: proposal.template?.name ?? null,
      status: proposal.status,
      sentAt: proposal.sentAt,
      sentToEmail: proposal.sentToEmail,
      deliveryToken: proposal.deliveryToken,
      preparedContractId: proposal.preparedContractId,
      currentVersion: proposal.currentVersion
        ? {
            id: proposal.currentVersion.id,
            versionNumber: proposal.currentVersion.versionNumber,
            title: proposal.currentVersion.title,
            introduction: proposal.currentVersion.introduction,
            terms: proposal.currentVersion.terms,
            footer: proposal.currentVersion.footer,
            quoteVersionId: proposal.currentVersion.quoteVersionId,
            createdAt: proposal.currentVersion.createdAt,
          }
        : null,
      versionCount: proposal._count.versions,
      viewCount: proposal._count.viewHistory,
      acceptance: proposal.acceptance
        ? {
            id: proposal.acceptance.id,
            status: proposal.acceptance.status,
            acceptedByName: proposal.acceptance.acceptedByName,
            acceptedByEmail: proposal.acceptance.acceptedByEmail,
            signatureNotes: proposal.acceptance.signatureNotes,
            acceptedAt: proposal.acceptance.acceptedAt,
          }
        : null,
    },
    quote: {
      id: quote.id,
      businessId: quote.businessId,
      opportunityId: quote.opportunityId,
      opportunityName: quote.opportunity.name,
      quoteNumber: quote.quoteNumber,
      status: quote.status,
      currency: quote.currency,
      validUntil: quote.validUntil,
      sentAt: quote.sentAt,
      sentToEmail: quote.sentToEmail,
      deliveryToken: quote.deliveryToken,
      currentVersion: quote.currentVersion ? mapQuoteVersion(quote.currentVersion) : null,
      versionCount: quote._count.versions,
    },
  };
}

export async function listProposals(businessId: string): Promise<ProposalData[]> {
  const proposals = await prisma.proposal.findMany({
    where: { businessId },
    include: {
      quote: true,
      template: true,
      currentVersion: true,
      acceptance: true,
      _count: { select: { versions: true, viewHistory: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return proposals.map((proposal) => ({
    id: proposal.id,
    businessId: proposal.businessId,
    quoteId: proposal.quoteId,
    quoteNumber: proposal.quote.quoteNumber,
    templateId: proposal.templateId,
    templateName: proposal.template?.name ?? null,
    status: proposal.status,
    sentAt: proposal.sentAt,
    sentToEmail: proposal.sentToEmail,
    deliveryToken: proposal.deliveryToken,
    preparedContractId: proposal.preparedContractId,
    currentVersion: proposal.currentVersion
      ? {
          id: proposal.currentVersion.id,
          versionNumber: proposal.currentVersion.versionNumber,
          title: proposal.currentVersion.title,
          introduction: proposal.currentVersion.introduction,
          terms: proposal.currentVersion.terms,
          footer: proposal.currentVersion.footer,
          quoteVersionId: proposal.currentVersion.quoteVersionId,
          createdAt: proposal.currentVersion.createdAt,
        }
      : null,
    versionCount: proposal._count.versions,
    viewCount: proposal._count.viewHistory,
    acceptance: proposal.acceptance
      ? {
          id: proposal.acceptance.id,
          status: proposal.acceptance.status,
          acceptedByName: proposal.acceptance.acceptedByName,
          acceptedByEmail: proposal.acceptance.acceptedByEmail,
          signatureNotes: proposal.acceptance.signatureNotes,
          acceptedAt: proposal.acceptance.acceptedAt,
        }
      : null,
  }));
}

export async function getQuotesDashboard(businessId: string): Promise<QuotesDashboardData> {
  const [quotes, proposals] = await Promise.all([
    prisma.quote.findMany({
      where: { businessId, deletedAt: null },
      include: { currentVersion: true },
    }),
    prisma.proposal.findMany({ where: { businessId }, include: { acceptance: true } }),
  ]);

  return {
    totalQuotes: quotes.length,
    draftQuotes: quotes.filter((quote) => quote.status === "DRAFT").length,
    pendingApprovalQuotes: quotes.filter((quote) => quote.status === "PENDING_APPROVAL").length,
    sentQuotes: quotes.filter((quote) => quote.status === "SENT").length,
    totalProposals: proposals.length,
    acceptedProposals: proposals.filter((proposal) => proposal.acceptance?.status === "ACCEPTED")
      .length,
    totalQuotedValuePence: quotes.reduce(
      (sum, quote) => sum + (quote.currentVersion?.totalPence ?? 0),
      0,
    ),
  };
}

export { calculateQuotePricing };

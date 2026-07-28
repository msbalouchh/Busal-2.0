import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "@prisma/client";

import { PERMISSION_CODES } from "../src/modules/authorization/constants/permissions";
import { calculateQuotePricing } from "../src/modules/quotes/utils/pricing-engine";
import { QUOTES_ROUTES } from "../src/modules/quotes/constants/routes";
import { formatQuoteMoney } from "../src/modules/quotes/utils/quote-utils";
import {
  createCommercialBundle,
  createCommercialProduct,
} from "../src/services/commercial-catalogue.service";
import {
  acceptProposal,
  createProposalRevision,
  createProposalTemplate,
  createQuote,
  createQuoteRevision,
  generateProposalFromQuote,
  getProposalByToken,
  getQuote,
  listQuoteVersions,
  recordProposalView,
  requestQuoteApproval,
  reviewQuoteApproval,
  sendProposal,
  sendQuote,
} from "../src/services/quotes-proposals.service";
import {
  createSalesCompany,
  createSalesOpportunity,
  ensureDefaultSalesPipeline,
} from "../src/services/sales-crm.service";

const prisma = new PrismaClient();
const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function assertGbpFormat(value: string): void {
  assert(value.includes("£"), "formatted value should use GBP symbol");
}

function assertIntegerPenceValue(value: number, label: string): void {
  assert(Number.isInteger(value), `${label} must be integer pence`);
}

async function main() {
  console.log("Module structure");
  const moduleFiles = [
    "src/modules/quotes/index.ts",
    "src/modules/quotes/constants/routes.ts",
    "src/modules/quotes/utils/pricing-engine.ts",
    "src/modules/quotes/utils/quote-utils.ts",
    "src/modules/quotes/utils/quote-audit.ts",
    "src/modules/quotes/lib/get-quotes-context.ts",
    "src/modules/quotes/actions/quotes-actions.ts",
    "src/modules/quotes/actions/public-proposal-actions.ts",
    "src/modules/quotes/components/quotes-dashboard.tsx",
    "src/modules/quotes/components/quotes-lists.tsx",
    "src/modules/quotes/components/quotes-nav.tsx",
    "src/services/quotes-proposals.service.ts",
    "src/app/dashboard/quotes/page.tsx",
    "src/app/dashboard/quotes/quotes/page.tsx",
    "src/app/dashboard/quotes/templates/page.tsx",
    "src/app/dashboard/quotes/proposals/page.tsx",
    "src/app/proposals/[token]/page.tsx",
  ];

  for (const file of moduleFiles) {
    readFileSync(join(root, file), "utf8");
  }
  console.log("  PASS");

  console.log("Quotes routes");
  assert(QUOTES_ROUTES.overview === "/dashboard/quotes", "quotes route mismatch");
  console.log("  PASS");

  console.log("Permission protected");
  const contextSource = readFileSync(
    join(root, "src/modules/quotes/lib/get-quotes-context.ts"),
    "utf8",
  );
  const actionsSource = readFileSync(
    join(root, "src/modules/quotes/actions/quotes-actions.ts"),
    "utf8",
  );
  assert(contextSource.includes("protectedPage"), "quotes pages should use protectedPage");
  assert(contextSource.includes("PERMISSION_CODES.QUOTES_VIEW"), "quotes.view required");
  assert(actionsSource.includes("protectedAction"), "quotes actions should use protectedAction");
  assert(actionsSource.includes("PERMISSION_CODES.QUOTES_CREATE"), "quotes.create required");
  assert(actionsSource.includes("PERMISSION_CODES.QUOTES_APPROVE"), "quotes.approve required");
  assert(actionsSource.includes("PERMISSION_CODES.PROPOSALS_MANAGE"), "proposals.manage required");
  assert(PERMISSION_CODES.QUOTES_VIEW === "quotes.view", "quotes.view code missing");
  assert(PERMISSION_CODES.QUOTES_ACCEPT === "quotes.accept", "quotes.accept code missing");
  console.log("  PASS");

  console.log("Pricing engine");
  const pricing = calculateQuotePricing({
    lineItems: [
      { lineType: "PRODUCT", quantity: 2, unitPricePence: 5000, billingCycle: "ONE_TIME" },
      {
        lineType: "MANAGED_SERVICE",
        quantity: 1,
        unitPricePence: 9900,
        billingCycle: "MONTHLY",
      },
      {
        lineType: "CUSTOM",
        quantity: 1,
        unitPricePence: 15000,
        lineDiscountPence: 1000,
        billingCycle: "ONE_TIME",
      },
    ],
    quoteDiscountPence: 500,
    defaultTaxRateBps: 2000,
  });
  assertIntegerPenceValue(pricing.subtotalPence, "subtotal");
  assertIntegerPenceValue(pricing.taxPence, "tax");
  assertIntegerPenceValue(pricing.oneTimeTotalPence, "one-time total");
  assertIntegerPenceValue(pricing.recurringTotalPence, "recurring total");
  assertIntegerPenceValue(pricing.totalPence, "total");
  assertGbpFormat(formatQuoteMoney(pricing.totalPence));
  console.log("  PASS");

  console.log("Schema");
  const schemaSource = readFileSync(join(root, "prisma/schema.prisma"), "utf8");
  assert(schemaSource.includes("model Quote"), "Quote model missing");
  assert(schemaSource.includes("model Proposal"), "Proposal model missing");
  assert(schemaSource.includes("model ProposalTemplate"), "ProposalTemplate model missing");
  assert(schemaSource.includes("preparedContractId"), "prepared contract relationship missing");
  assert(schemaSource.includes("totalPence          Int"), "total must be integer pence");
  console.log("  PASS");

  const business = await prisma.business.findFirst({ select: { id: true } });
  assert(business, "No business found");

  const suffix = Date.now().toString();
  await ensureDefaultSalesPipeline(business.id);
  const company = await createSalesCompany(business.id, null, {
    name: `Quote Co ${suffix}`,
  });
  const opportunity = await createSalesOpportunity(business.id, null, {
    companyId: company.id,
    name: `Quote Opportunity ${suffix}`,
    valuePence: 0,
  });

  const product = await createCommercialProduct(business.id, null, {
    sku: `QUOTE-PROD-${suffix}`,
    name: `Quote Product ${suffix}`,
    pricingModel: "MONTHLY",
    basePricePence: 9900,
  });
  const implementation = await createCommercialProduct(business.id, null, {
    sku: `QUOTE-IMPL-${suffix}`,
    name: `Implementation ${suffix}`,
    pricingModel: "ONE_TIME",
    basePricePence: 75000,
    setupRequired: true,
  });
  const managed = await createCommercialProduct(business.id, null, {
    sku: `QUOTE-MS-${suffix}`,
    name: `Managed Service ${suffix}`,
    pricingModel: "MONTHLY",
    basePricePence: 15000,
    renewable: true,
  });
  const professional = await createCommercialProduct(business.id, null, {
    sku: `QUOTE-PS-${suffix}`,
    name: `Professional Service ${suffix}`,
    pricingModel: "ONE_TIME",
    basePricePence: 12000,
    assignedDepartment: "Professional Services",
  });
  assert(product.currentVersion, "product version missing");
  assert(implementation.currentVersion, "implementation version missing");

  const bundle = await createCommercialBundle(business.id, null, {
    sku: `QUOTE-BUNDLE-${suffix}`,
    name: `Quote Bundle ${suffix}`,
    bundlePricePence: 200000,
    items: [
      {
        productVersionId: product.currentVersion!.id,
        quantity: 1,
        individualPricePence: 9900,
      },
    ],
  });
  assert(bundle.currentVersion, "bundle version missing");

  console.log("Quote creation linked to opportunity");
  const quote = await createQuote(business.id, null, {
    opportunityId: opportunity.id,
    title: `Enterprise Quote ${suffix}`,
    discountPence: 2500,
    lineItems: [
      {
        lineType: "PRODUCT",
        productVersionId: product.currentVersion!.id,
        unitPricePence: 9900,
        quantity: 2,
        billingCycle: "MONTHLY",
      },
      {
        lineType: "BUNDLE",
        bundleVersionId: bundle.currentVersion!.id,
        unitPricePence: 200000,
        billingCycle: "ONE_TIME",
      },
      {
        lineType: "IMPLEMENTATION_PACKAGE",
        productVersionId: implementation.currentVersion!.id,
        unitPricePence: 75000,
        billingCycle: "ONE_TIME",
      },
      {
        lineType: "MANAGED_SERVICE",
        productVersionId: managed.currentVersion!.id,
        unitPricePence: 15000,
        billingCycle: "MONTHLY",
      },
      {
        lineType: "PROFESSIONAL_SERVICE",
        productVersionId: professional.currentVersion!.id,
        unitPricePence: 12000,
        billingCycle: "ONE_TIME",
      },
      {
        lineType: "CUSTOM",
        customName: "On-site training",
        unitPricePence: 8000,
        billingCycle: "ONE_TIME",
      },
    ],
  });
  assert(quote.opportunityId === opportunity.id, "quote should link to opportunity");
  assert(quote.currentVersion, "quote version missing");
  assert(quote.currentVersion.lineItems.length === 6, "quote line items missing");
  assertIntegerPenceValue(quote.currentVersion.totalPence, "quote total");

  const linkedOpportunity = await prisma.salesOpportunity.findUnique({
    where: { id: opportunity.id },
    select: { preparedQuoteId: true },
  });
  assert(
    linkedOpportunity?.preparedQuoteId === quote.id,
    "opportunity prepared quote link missing",
  );
  console.log("  PASS");

  console.log("Revision history");
  const revision = await createQuoteRevision(quote.id, business.id, null, {
    title: `Enterprise Quote ${suffix} v2`,
    discountPence: 1000,
    lineItems: [
      {
        lineType: "CUSTOM",
        customName: "Revised custom scope",
        unitPricePence: 10000,
      },
    ],
  });
  assert(revision.versionCount === 2, "revision count mismatch");
  const versions = await listQuoteVersions(quote.id, business.id);
  assert(versions.length === 2, "quote versions missing");
  console.log("  PASS");

  console.log("Approval workflow");
  await requestQuoteApproval(quote.id, business.id, null, "Needs manager sign-off");
  const approved = await reviewQuoteApproval(quote.id, business.id, null, {
    approved: true,
    reviewNotes: "Approved for send",
  });
  assert(approved.status === "APPROVED", "quote should be approved");
  console.log("  PASS");

  console.log("Client delivery");
  const sentQuote = await sendQuote(quote.id, business.id, null, `client-${suffix}@example.com`);
  assert(sentQuote.status === "SENT", "quote should be sent");
  assert(sentQuote.deliveryToken, "delivery token missing");
  console.log("  PASS");

  console.log("Proposal builder and templates");
  const template = await createProposalTemplate(business.id, null, {
    name: `Standard Proposal ${suffix}`,
    introduction: "Thank you for considering Busal OS.",
    termsTemplate: "Payment due within 30 days.",
  });
  const proposal = await generateProposalFromQuote(business.id, null, {
    quoteId: quote.id,
    templateId: template.id,
    title: `Proposal for ${company.name}`,
  });
  assert(proposal.currentVersion, "proposal version missing");
  assert(proposal.preparedContractId === null, "contract relationship should remain unset");

  const linkedProposalOpportunity = await prisma.salesOpportunity.findUnique({
    where: { id: opportunity.id },
    select: { preparedProposalId: true },
  });
  assert(
    linkedProposalOpportunity?.preparedProposalId === proposal.id,
    "opportunity prepared proposal link missing",
  );

  const revisedProposal = await createProposalRevision(proposal.id, business.id, null, {
    title: `Proposal for ${company.name} v2`,
  });
  assert(revisedProposal.versionCount === 2, "proposal revision missing");
  console.log("  PASS");

  console.log("Proposal view history and acceptance");
  const sentProposal = await sendProposal(
    proposal.id,
    business.id,
    null,
    `client-${suffix}@example.com`,
  );
  assert(sentProposal.deliveryToken, "proposal delivery token missing");

  await recordProposalView(sentProposal.deliveryToken!, {
    viewerEmail: `client-${suffix}@example.com`,
  });
  const viewed = await getProposalByToken(sentProposal.deliveryToken!);
  assert(viewed.proposal.viewCount >= 1, "proposal view history missing");

  const accepted = await acceptProposal(sentProposal.deliveryToken!, {
    acceptedByName: "Client Signatory",
    acceptedByEmail: `client-${suffix}@example.com`,
    signatureNotes: "Accepted electronically",
  });
  assert(accepted.acceptance?.status === "ACCEPTED", "proposal acceptance failed");

  const acceptedQuote = await getQuote(quote.id, business.id);
  assert(acceptedQuote.status === "ACCEPTED", "quote should be accepted with proposal");
  console.log("  PASS");

  console.log("\nQuotes & Proposals verification complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

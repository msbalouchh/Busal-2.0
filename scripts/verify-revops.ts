import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "@prisma/client";

import { PERMISSION_CODES } from "../src/modules/authorization/constants/permissions";
import { REVOPS_PAYMENT_PROVIDERS } from "../src/modules/revops/constants/payment-providers";
import { REVOPS_ROUTES } from "../src/modules/revops/constants/routes";
import {
  activateContract,
  generateContractFromProposal,
  recordContractSignature,
  requestContractApproval,
  reviewContractApproval,
} from "../src/services/contracts.service";
import { createCommercialProduct } from "../src/services/commercial-catalogue.service";
import {
  generateInvoiceFromImplementationProject,
  generateInvoiceFromService,
  createCollectionCase,
  createRevenueExpense,
  generateRevenueForecast,
  getProfitabilityReport,
  getRevopsDashboard,
  getRevenueAnalytics,
  issueInvoice,
  listRevenueInvoices,
  recordInvoicePayment,
  recognizeRevenue,
} from "../src/services/revops.service";
import { updateImplementationTaskStatus } from "../src/services/implementation-delivery.service";
import {
  acceptProposal,
  createProposalTemplate,
  createQuote,
  generateProposalFromQuote,
  requestQuoteApproval,
  reviewQuoteApproval,
  sendProposal,
} from "../src/services/quotes-proposals.service";
import {
  createSalesCompany,
  createSalesContact,
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

async function main() {
  console.log("Module structure");
  const moduleFiles = [
    "src/modules/revops/index.ts",
    "src/modules/revops/constants/routes.ts",
    "src/modules/revops/constants/payment-providers.ts",
    "src/modules/revops/utils/revops-utils.ts",
    "src/modules/revops/utils/revops-audit.ts",
    "src/modules/revops/lib/get-revops-context.ts",
    "src/modules/revops/actions/revops-actions.ts",
    "src/modules/revops/components/revops-dashboard.tsx",
    "src/modules/revops/components/revops-lists.tsx",
    "src/modules/revops/components/revops-nav.tsx",
    "src/services/revops.service.ts",
    "src/app/dashboard/revops/page.tsx",
    "src/app/dashboard/revops/invoices/page.tsx",
    "src/app/dashboard/revops/payments/page.tsx",
    "src/app/dashboard/revops/recognition/page.tsx",
    "src/app/dashboard/revops/expenses/page.tsx",
    "src/app/dashboard/revops/profitability/page.tsx",
    "src/app/dashboard/revops/forecasting/page.tsx",
    "src/app/dashboard/revops/analytics/page.tsx",
    "src/app/dashboard/revops/collections/page.tsx",
  ];

  for (const file of moduleFiles) {
    readFileSync(join(root, file), "utf8");
  }
  console.log("  PASS");

  console.log("RevOps routes");
  assert(REVOPS_ROUTES.overview === "/dashboard/revops", "revops route mismatch");
  console.log("  PASS");

  console.log("Payment provider architecture");
  assert(REVOPS_PAYMENT_PROVIDERS.STRIPE.integrationReady === false, "stripe should be planned");
  assert(REVOPS_PAYMENT_PROVIDERS.GOCARDLESS.id === "GOCARDLESS", "gocardless missing");
  assert(REVOPS_PAYMENT_PROVIDERS.BANK_TRANSFER.id === "BANK_TRANSFER", "bank transfer missing");
  assert(REVOPS_PAYMENT_PROVIDERS.PAYPAL.id === "PAYPAL", "paypal missing");
  console.log("  PASS");

  console.log("Permission protected");
  const contextSource = readFileSync(
    join(root, "src/modules/revops/lib/get-revops-context.ts"),
    "utf8",
  );
  const actionsSource = readFileSync(
    join(root, "src/modules/revops/actions/revops-actions.ts"),
    "utf8",
  );
  assert(contextSource.includes("protectedPage"), "pages should use protectedPage");
  assert(contextSource.includes("PERMISSION_CODES.REVENUE_VIEW"), "revenue.view required");
  assert(actionsSource.includes("PERMISSION_CODES.INVOICES_MANAGE"), "invoices.manage required");
  assert(PERMISSION_CODES.FORECASTING_VIEW === "forecasting.view", "permission code missing");
  console.log("  PASS");

  console.log("Schema");
  const schemaSource = readFileSync(join(root, "prisma/schema.prisma"), "utf8");
  assert(schemaSource.includes("model RevenueInvoice"), "RevenueInvoice missing");
  assert(schemaSource.includes("model RevenueRecognitionEntry"), "recognition missing");
  assert(schemaSource.includes("model RevenueExpense"), "expense missing");
  assert(schemaSource.includes("RevopsPaymentMethod"), "payment method enum missing");
  console.log("  PASS");

  const business = await prisma.business.findFirst({ select: { id: true } });
  assert(business, "No business found");

  const suffix = Date.now().toString();

  await ensureDefaultSalesPipeline(business.id);
  const company = await createSalesCompany(business.id, null, {
    name: `RevOps Co ${suffix}`,
    email: `revops-co-${suffix}@example.com`,
    industry: "hospitality",
  });
  const contact = await createSalesContact(business.id, null, {
    companyId: company.id,
    firstName: "Riley",
    lastName: `Finance ${suffix}`,
    email: `revops-client-${suffix}@example.com`,
    phone: `07${suffix.slice(-9).padStart(9, "8")}`,
  });
  const opportunity = await createSalesOpportunity(business.id, null, {
    companyId: company.id,
    contactId: contact.id,
    name: `RevOps Opportunity ${suffix}`,
    valuePence: 240000,
  });

  const product = await createCommercialProduct(business.id, null, {
    sku: `REVOPS-PROD-${suffix}`,
    name: `RevOps Product ${suffix}`,
    pricingModel: "MONTHLY",
    basePricePence: 120000,
  });
  assert(product.currentVersion, "product version missing");

  const quote = await createQuote(business.id, null, {
    opportunityId: opportunity.id,
    title: `RevOps Quote ${suffix}`,
    lineItems: [
      {
        lineType: "PRODUCT",
        productVersionId: product.currentVersion!.id,
        unitPricePence: 120000,
        quantity: 1,
        billingCycle: "MONTHLY",
      },
    ],
  });
  await requestQuoteApproval(quote.id, business.id, null);
  await reviewQuoteApproval(quote.id, business.id, null, { approved: true });

  const proposalTemplate = await createProposalTemplate(business.id, null, {
    name: `RevOps Proposal ${suffix}`,
    termsTemplate: "Standard revops terms apply.",
  });
  const proposal = await generateProposalFromQuote(business.id, null, {
    quoteId: quote.id,
    templateId: proposalTemplate.id,
  });
  const sentProposal = await sendProposal(
    proposal.id,
    business.id,
    null,
    `revops-client-${suffix}@example.com`,
  );
  await acceptProposal(sentProposal.deliveryToken!, {
    acceptedByName: "Riley Finance",
    acceptedByEmail: `revops-client-${suffix}@example.com`,
  });

  const contract = await generateContractFromProposal(business.id, null, {
    proposalId: proposal.id,
    endDate: new Date(Date.now() + 365 * 86400000),
  });
  await requestContractApproval(contract.id, business.id, null);
  await reviewContractApproval(contract.id, business.id, null, { approved: true });
  await recordContractSignature(contract.id, business.id, null, {
    party: "INTERNAL",
    signedByName: "Busal Legal",
    signedByEmail: "legal@busal.test",
    provider: "MANUAL",
  });
  await recordContractSignature(contract.id, business.id, null, {
    party: "CUSTOMER",
    signedByName: "Riley Finance",
    signedByEmail: `revops-client-${suffix}@example.com`,
    provider: "MANUAL",
  });

  console.log("Invoice from contract activation");
  await activateContract(contract.id, business.id, null, {
    customerName: `Riley Finance ${suffix}`,
    customerEmail: `activated-revops-${suffix}@example.com`,
    customerPhone: `07${suffix.slice(-9).padStart(9, "9")}`,
  });

  const activation = await prisma.customerActivation.findUnique({
    where: { contractId: contract.id },
  });
  assert(activation?.preparedFirstInvoiceId, "contract invoice should be prepared on activation");

  const contractInvoice = await prisma.revenueInvoice.findUnique({
    where: { id: activation!.preparedFirstInvoiceId! },
  });
  assert(contractInvoice?.sourceType === "CONTRACT", "contract invoice source mismatch");
  console.log("  PASS");

  const project = await prisma.implementationProject.findUnique({
    where: { contractId: contract.id },
    include: { milestones: { include: { tasks: true } } },
  });
  assert(project, "implementation project missing");

  console.log("Invoice from implementation project");
  const projectInvoiceId = await generateInvoiceFromImplementationProject(
    project!.id,
    business.id,
    null,
  );
  const projectInvoice = await prisma.revenueInvoice.findUnique({
    where: { id: projectInvoiceId },
  });
  assert(projectInvoice?.sourceType === "IMPLEMENTATION_PROJECT", "project invoice missing");
  console.log("  PASS");

  console.log("Managed and professional service invoices");
  await generateInvoiceFromService(business.id, null, {
    sourceType: "MANAGED_SERVICE",
    customerId: activation!.customerId,
    contractId: contract.id,
    industry: "hospitality",
    serviceType: "managed-support",
    description: "Managed support retainer",
    amountPence: 15000,
  });
  await generateInvoiceFromService(business.id, null, {
    sourceType: "PROFESSIONAL_SERVICE",
    customerId: activation!.customerId,
    contractId: contract.id,
    industry: "hospitality",
    serviceType: "consulting",
    description: "Professional services day rate",
    amountPence: 35000,
  });
  console.log("  PASS");

  console.log("Milestone invoice generation");
  const milestone = project!.milestones[0];
  assert(milestone, "milestone missing");
  for (const task of milestone.tasks) {
    await updateImplementationTaskStatus(task.id, business.id, null, "COMPLETED");
  }
  const milestoneInvoice = await prisma.revenueInvoice.findFirst({
    where: { milestoneId: milestone.id, businessId: business.id },
  });
  assert(milestoneInvoice, "milestone invoice missing");
  console.log("  PASS");

  console.log("Invoice lifecycle and payments");
  const issued = await issueInvoice(contractInvoice!.id, business.id, null);
  assert(issued.status === "ISSUED", "invoice should be issued");

  const paid = await recordInvoicePayment(contractInvoice!.id, business.id, null, {
    amountPence: contractInvoice!.totalPence,
    paymentMethod: "MANUAL",
  });
  assert(paid.status === "PAID", "invoice should be paid");
  assert(paid.payments.length >= 1, "payment history missing");
  console.log("  PASS");

  console.log("Revenue recognition");
  await recognizeRevenue(projectInvoiceId, business.id, null);
  const recognitionCount = await prisma.revenueRecognitionEntry.count({
    where: { invoiceId: projectInvoiceId },
  });
  assert(recognitionCount >= 1, "recognition entry missing");
  console.log("  PASS");

  console.log("Expenses and profitability");
  await createRevenueExpense(business.id, null, {
    description: "Delivery contractor",
    amountPence: 8000,
    customerId: activation!.customerId,
    implementationProjectId: project!.id,
    industry: "hospitality",
    serviceType: "implementation",
  });

  const profitability = await getProfitabilityReport(business.id);
  assert(profitability.byCustomer.length >= 1, "customer profitability missing");
  assert(profitability.byIndustry.length >= 1, "industry profitability missing");
  console.log("  PASS");

  console.log("Forecasting");
  const forecast = await generateRevenueForecast(business.id);
  assert(forecast.length === 6, "forecast should cover six months");
  assert(forecast[0]!.totalProjectedPence >= 0, "forecast total invalid");
  console.log("  PASS");

  console.log("Collections");
  const unpaidInvoice = await prisma.revenueInvoice.findFirst({
    where: { businessId: business.id, status: { in: ["ISSUED", "DRAFT"] } },
  });
  if (unpaidInvoice) {
    await issueInvoice(unpaidInvoice.id, business.id, null, new Date(Date.now() - 86400000));
    await createCollectionCase(unpaidInvoice.id, business.id, null, {
      notes: "Follow up on overdue invoice",
    });
  }
  const collections = await prisma.revenueCollectionCase.count({
    where: { invoice: { businessId: business.id } },
  });
  assert(collections >= 1, "collection case missing");
  console.log("  PASS");

  console.log("Executive dashboard and analytics");
  const dashboard = await getRevopsDashboard(business.id);
  assert(dashboard.totalInvoicedPence > 0, "dashboard invoiced total missing");

  const analytics = await getRevenueAnalytics(business.id);
  assert(analytics.invoicesByStatus.length >= 1, "analytics by status missing");
  assert(analytics.revenueBySource.length >= 1, "analytics by source missing");

  const invoices = await listRevenueInvoices(business.id);
  assert(invoices.length >= 4, "invoice listing failed");
  console.log("  PASS");

  console.log("\nRevenue Operations verification complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

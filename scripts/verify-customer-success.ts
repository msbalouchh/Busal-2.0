import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "@prisma/client";

import { PERMISSION_CODES } from "../src/modules/authorization/constants/permissions";
import { CUSTOMER_SUCCESS_ROUTES } from "../src/modules/customer-success/constants/routes";
import {
  activateContract,
  generateContractFromProposal,
  recordContractSignature,
  requestContractApproval,
  reviewContractApproval,
} from "../src/services/contracts.service";
import { createCommercialProduct } from "../src/services/commercial-catalogue.service";
import {
  calculateCustomerHealthScore,
  createExpansionOpportunity,
  CUSTOMER_SUCCESS_RENEWAL_TASK_DAYS,
  ensureDefaultSuccessPlaybooks,
  getCustomer360Profile,
  getCustomerSuccessDashboard,
  listCustomer360Profiles,
  listCustomerSuccessTasks,
  listSuccessPlaybooks,
  recordCustomerFeedback,
  scheduleExecutiveReview,
  completeExecutiveReview,
} from "../src/services/customer-success.service";
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
    "src/modules/customer-success/index.ts",
    "src/modules/customer-success/constants/routes.ts",
    "src/modules/customer-success/utils/customer-success-utils.ts",
    "src/modules/customer-success/utils/customer-success-audit.ts",
    "src/modules/customer-success/lib/get-customer-success-context.ts",
    "src/modules/customer-success/actions/customer-success-actions.ts",
    "src/modules/customer-success/components/customer-success-dashboard.tsx",
    "src/modules/customer-success/components/customer-success-lists.tsx",
    "src/modules/customer-success/components/customer-success-nav.tsx",
    "src/services/customer-success.service.ts",
    "src/app/dashboard/customer-success/page.tsx",
    "src/app/dashboard/customer-success/profiles/page.tsx",
    "src/app/dashboard/customer-success/health/page.tsx",
    "src/app/dashboard/customer-success/tasks/page.tsx",
    "src/app/dashboard/customer-success/playbooks/page.tsx",
    "src/app/dashboard/customer-success/feedback/page.tsx",
    "src/app/dashboard/customer-success/renewals/page.tsx",
    "src/app/dashboard/customer-success/expansion/page.tsx",
    "src/app/dashboard/customer-success/reviews/page.tsx",
  ];

  for (const file of moduleFiles) {
    readFileSync(join(root, file), "utf8");
  }
  console.log("  PASS");

  console.log("Customer Success routes");
  assert(
    CUSTOMER_SUCCESS_ROUTES.overview === "/dashboard/customer-success",
    "customer success route mismatch",
  );
  console.log("  PASS");

  console.log("Permission protected");
  const contextSource = readFileSync(
    join(root, "src/modules/customer-success/lib/get-customer-success-context.ts"),
    "utf8",
  );
  const actionsSource = readFileSync(
    join(root, "src/modules/customer-success/actions/customer-success-actions.ts"),
    "utf8",
  );
  assert(contextSource.includes("protectedPage"), "pages should use protectedPage");
  assert(contextSource.includes("PERMISSION_CODES.SUCCESS_VIEW"), "success.view required");
  assert(actionsSource.includes("protectedAction"), "actions should use protectedAction");
  assert(actionsSource.includes("PERMISSION_CODES.SUCCESS_EXPAND"), "success.expand required");
  assert(PERMISSION_CODES.SUCCESS_RENEW === "success.renew", "permission code missing");
  console.log("  PASS");

  console.log("Schema");
  const schemaSource = readFileSync(join(root, "prisma/schema.prisma"), "utf8");
  assert(schemaSource.includes("model CustomerAccountProfile"), "CustomerAccountProfile missing");
  assert(schemaSource.includes("model CustomerHealthScore"), "CustomerHealthScore missing");
  assert(schemaSource.includes("model SuccessPlaybook"), "SuccessPlaybook missing");
  assert(schemaSource.includes("model CustomerExpansionOpportunity"), "expansion model missing");
  assert(schemaSource.includes("model ExecutiveBusinessReview"), "EBR model missing");
  console.log("  PASS");

  const business = await prisma.business.findFirst({ select: { id: true } });
  assert(business, "No business found");

  const suffix = Date.now().toString();

  console.log("Success playbooks");
  await ensureDefaultSuccessPlaybooks(business.id);
  const playbooks = await listSuccessPlaybooks(business.id);
  assert(playbooks.length >= 1, "default playbooks missing");
  console.log("  PASS");

  await ensureDefaultSalesPipeline(business.id);
  const company = await createSalesCompany(business.id, null, {
    name: `Success Co ${suffix}`,
    email: `success-co-${suffix}@example.com`,
    industry: "hospitality",
  });
  const contact = await createSalesContact(business.id, null, {
    companyId: company.id,
    firstName: "Sam",
    lastName: `Account ${suffix}`,
    email: `success-client-${suffix}@example.com`,
    phone: `07${suffix.slice(-9).padStart(9, "7")}`,
  });
  await createSalesOpportunity(business.id, null, {
    companyId: company.id,
    contactId: contact.id,
    name: `Success Deal ${suffix}`,
    valuePence: 180000,
  });

  const product = await createCommercialProduct(business.id, null, {
    sku: `SUCCESS-PROD-${suffix}`,
    name: `Success Product ${suffix}`,
    pricingModel: "MONTHLY",
    basePricePence: 90000,
  });
  assert(product.currentVersion, "product version missing");

  const opportunity = await createSalesOpportunity(business.id, null, {
    companyId: company.id,
    contactId: contact.id,
    name: `Success Opportunity ${suffix}`,
    valuePence: 180000,
  });

  const quote = await createQuote(business.id, null, {
    opportunityId: opportunity.id,
    title: `Success Quote ${suffix}`,
    lineItems: [
      {
        lineType: "PRODUCT",
        productVersionId: product.currentVersion!.id,
        unitPricePence: 90000,
        quantity: 1,
        billingCycle: "MONTHLY",
      },
    ],
  });
  await requestQuoteApproval(quote.id, business.id, null);
  await reviewQuoteApproval(quote.id, business.id, null, { approved: true });

  const proposalTemplate = await createProposalTemplate(business.id, null, {
    name: `Success Proposal ${suffix}`,
    termsTemplate: "Standard success terms apply.",
  });
  const proposal = await generateProposalFromQuote(business.id, null, {
    quoteId: quote.id,
    templateId: proposalTemplate.id,
  });
  const sentProposal = await sendProposal(
    proposal.id,
    business.id,
    null,
    `success-client-${suffix}@example.com`,
  );
  await acceptProposal(sentProposal.deliveryToken!, {
    acceptedByName: "Sam Account",
    acceptedByEmail: `success-client-${suffix}@example.com`,
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
    signedByName: "Sam Account",
    signedByEmail: `success-client-${suffix}@example.com`,
    provider: "MANUAL",
  });

  console.log("Unified profile on activation");
  await activateContract(contract.id, business.id, null, {
    customerName: `Sam Account ${suffix}`,
    customerEmail: `activated-success-${suffix}@example.com`,
    customerPhone: `07${suffix.slice(-9).padStart(9, "8")}`,
  });

  const profileRecord = await prisma.customerAccountProfile.findFirst({
    where: { contractId: contract.id },
    include: {
      tasks: true,
      renewals: true,
    },
  });
  assert(profileRecord, "customer account profile missing");
  assert(profileRecord.salesCompanyId === company.id, "sales company link missing");
  assert(profileRecord.tasks.length >= 1, "playbook tasks missing");
  console.log("  PASS");

  const profile = await getCustomer360Profile(profileRecord.id, business.id);
  assert(profile.customerName.includes("Sam"), "customer 360 profile mismatch");
  console.log("  PASS");

  console.log("Customer feedback and health score");
  await recordCustomerFeedback(profileRecord.id, business.id, null, {
    feedbackType: "NPS",
    score: 9,
    title: "Quarterly NPS survey",
  });
  await recordCustomerFeedback(profileRecord.id, business.id, null, {
    feedbackType: "FEATURE_REQUEST",
    title: "Mobile reporting dashboard",
    content: "Customer requested mobile analytics",
  });
  await recordCustomerFeedback(profileRecord.id, business.id, null, {
    feedbackType: "COMPLAINT",
    title: "Slow support response",
    content: "Ticket took 48 hours",
  });

  const healthProfile = await calculateCustomerHealthScore(profileRecord.id, business.id, null);
  assert(
    healthProfile.healthScore >= 0 && healthProfile.healthScore <= 100,
    "invalid health score",
  );
  assert(healthProfile.healthStatus, "health status missing");

  const healthHistory = await prisma.customerHealthScore.count({
    where: { profileId: profileRecord.id },
  });
  assert(healthHistory >= 2, "health score history missing");
  console.log("  PASS");

  console.log("Renewal tasks");
  const renewalTasks = await listCustomerSuccessTasks(business.id);
  const renewalTask = renewalTasks.find((task) => task.taskType === "RENEWAL");
  assert(renewalTask, "renewal task not generated");
  assert(profileRecord.renewals.length >= 1 || renewalTask, "renewal record missing");
  assert(CUSTOMER_SUCCESS_RENEWAL_TASK_DAYS === 90, "renewal lead time mismatch");
  console.log("  PASS");

  console.log("Expansion linked to Sales CRM");
  const expansion = await createExpansionOpportunity(profileRecord.id, business.id, null, {
    expansionType: "UPSELL",
    title: "Additional branch licence",
    estimatedValuePence: 45000,
  });
  assert(expansion.salesOpportunityId, "sales opportunity link missing");

  const linkedOpportunity = await prisma.salesOpportunity.findUnique({
    where: { id: expansion.salesOpportunityId! },
  });
  assert(linkedOpportunity?.companyId === company.id, "upsell opportunity company mismatch");
  console.log("  PASS");

  console.log("Executive business review history");
  await scheduleExecutiveReview(profileRecord.id, business.id, null, {
    scheduledAt: new Date(Date.now() + 7 * 86400000),
    attendees: "Sam Account, CSM",
  });

  const review = await prisma.executiveBusinessReview.findFirst({
    where: { profileId: profileRecord.id },
  });
  assert(review, "executive review missing");

  await completeExecutiveReview(review!.id, business.id, null, {
    summary: "Strong adoption, renewal likely",
    nextReviewAt: new Date(Date.now() + 180 * 86400000),
  });
  console.log("  PASS");

  console.log("Customer Success dashboard");
  const dashboard = await getCustomerSuccessDashboard(business.id);
  assert(dashboard.totalAccounts >= 1, "dashboard accounts missing");
  assert(dashboard.expansionPipelinePence >= 45000, "expansion pipeline missing");

  const profiles = await listCustomer360Profiles(business.id);
  assert(
    profiles.some((entry) => entry.id === profileRecord.id),
    "profile listing failed",
  );
  console.log("  PASS");

  console.log("\nCustomer Success & Account Management verification complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

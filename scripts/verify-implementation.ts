import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "@prisma/client";

import { PERMISSION_CODES } from "../src/modules/authorization/constants/permissions";
import { IMPLEMENTATION_ROUTES } from "../src/modules/implementation/constants/routes";
import {
  activateContract,
  generateContractFromProposal,
  recordContractSignature,
  requestContractApproval,
  reviewContractApproval,
} from "../src/services/contracts.service";
import { createCommercialProduct } from "../src/services/commercial-catalogue.service";
import {
  completeGoLiveChecklistItem,
  createChangeRequest,
  createImplementationIssue,
  createImplementationRisk,
  ensureDefaultProjectTemplates,
  executeGoLive,
  getImplementationPortalView,
  getImplementationProject,
  IMPLEMENTATION_HYPERCARE_DAYS,
  listImplementationProjects,
  listProjectTemplates,
  updateImplementationTaskStatus,
} from "../src/services/implementation-delivery.service";
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
    "src/modules/implementation/index.ts",
    "src/modules/implementation/constants/routes.ts",
    "src/modules/implementation/utils/implementation-utils.ts",
    "src/modules/implementation/utils/implementation-audit.ts",
    "src/modules/implementation/lib/get-implementation-context.ts",
    "src/modules/implementation/actions/implementation-actions.ts",
    "src/modules/implementation/components/implementation-dashboard.tsx",
    "src/modules/implementation/components/implementation-lists.tsx",
    "src/modules/implementation/components/implementation-nav.tsx",
    "src/services/implementation-delivery.service.ts",
    "src/app/dashboard/implementation/page.tsx",
    "src/app/dashboard/implementation/projects/page.tsx",
    "src/app/dashboard/implementation/templates/page.tsx",
    "src/app/dashboard/implementation/milestones/page.tsx",
    "src/app/dashboard/implementation/tasks/page.tsx",
    "src/app/dashboard/implementation/risks/page.tsx",
    "src/app/dashboard/implementation/issues/page.tsx",
    "src/app/dashboard/implementation/change-requests/page.tsx",
    "src/app/dashboard/implementation/go-live/page.tsx",
    "src/app/dashboard/implementation/hypercare/page.tsx",
    "src/app/implementation/[token]/page.tsx",
  ];

  for (const file of moduleFiles) {
    readFileSync(join(root, file), "utf8");
  }
  console.log("  PASS");

  console.log("Implementation routes");
  assert(
    IMPLEMENTATION_ROUTES.overview === "/dashboard/implementation",
    "implementation route mismatch",
  );
  console.log("  PASS");

  console.log("Permission protected");
  const contextSource = readFileSync(
    join(root, "src/modules/implementation/lib/get-implementation-context.ts"),
    "utf8",
  );
  const actionsSource = readFileSync(
    join(root, "src/modules/implementation/actions/implementation-actions.ts"),
    "utf8",
  );
  assert(contextSource.includes("protectedPage"), "implementation pages should use protectedPage");
  assert(
    contextSource.includes("PERMISSION_CODES.IMPLEMENTATION_VIEW"),
    "implementation.view required",
  );
  assert(
    actionsSource.includes("protectedAction"),
    "implementation actions should use protectedAction",
  );
  assert(
    actionsSource.includes("PERMISSION_CODES.IMPLEMENTATION_MANAGE"),
    "implementation.manage required",
  );
  assert(
    actionsSource.includes("PERMISSION_CODES.IMPLEMENTATION_APPROVE"),
    "implementation.approve required",
  );
  assert(PERMISSION_CODES.IMPLEMENTATION_VIEW === "implementation.view", "permission code missing");
  assert(
    PERMISSION_CODES.IMPLEMENTATION_CLOSE === "implementation.close",
    "permission code missing",
  );
  console.log("  PASS");

  console.log("Schema");
  const schemaSource = readFileSync(join(root, "prisma/schema.prisma"), "utf8");
  assert(schemaSource.includes("model ProjectTemplate"), "ProjectTemplate model missing");
  assert(schemaSource.includes("model ImplementationMilestone"), "ImplementationMilestone missing");
  assert(schemaSource.includes("model GoLiveChecklistItem"), "GoLiveChecklistItem missing");
  assert(schemaSource.includes("model ImplementationHypercare"), "ImplementationHypercare missing");
  assert(schemaSource.includes("portalToken"), "portal token missing");
  console.log("  PASS");

  const business = await prisma.business.findFirst({ select: { id: true } });
  assert(business, "No business found");

  const suffix = Date.now().toString();

  console.log("Project templates by industry");
  await ensureDefaultProjectTemplates(business.id);
  const templates = await listProjectTemplates(business.id);
  assert(templates.length >= 1, "default templates missing");
  assert(
    templates.some((template) => template.industry === "hospitality"),
    "hospitality template missing",
  );
  const listedTemplates = await listProjectTemplates(business.id);
  assert(listedTemplates.length >= 1, "template listing failed");
  console.log("  PASS");

  await ensureDefaultSalesPipeline(business.id);
  const company = await createSalesCompany(business.id, null, {
    name: `Implementation Co ${suffix}`,
    email: `implementation-co-${suffix}@example.com`,
    industry: "hospitality",
  });
  const contact = await createSalesContact(business.id, null, {
    companyId: company.id,
    firstName: "Alex",
    lastName: `Customer ${suffix}`,
    email: `implementation-client-${suffix}@example.com`,
    phone: `07${suffix.slice(-9).padStart(9, "5")}`,
  });
  const opportunity = await createSalesOpportunity(business.id, null, {
    companyId: company.id,
    contactId: contact.id,
    name: `Implementation Deal ${suffix}`,
    valuePence: 250000,
  });

  const product = await createCommercialProduct(business.id, null, {
    sku: `IMPLEMENTATION-PROD-${suffix}`,
    name: `Implementation Product ${suffix}`,
    pricingModel: "MONTHLY",
    basePricePence: 125000,
  });
  assert(product.currentVersion, "product version missing");

  const quote = await createQuote(business.id, null, {
    opportunityId: opportunity.id,
    title: `Implementation Quote ${suffix}`,
    lineItems: [
      {
        lineType: "PRODUCT",
        productVersionId: product.currentVersion!.id,
        unitPricePence: 125000,
        quantity: 1,
        billingCycle: "MONTHLY",
      },
    ],
  });
  await requestQuoteApproval(quote.id, business.id, null);
  await reviewQuoteApproval(quote.id, business.id, null, { approved: true });

  const proposalTemplate = await createProposalTemplate(business.id, null, {
    name: `Implementation Proposal ${suffix}`,
    termsTemplate: "Standard onboarding terms apply.",
  });
  const proposal = await generateProposalFromQuote(business.id, null, {
    quoteId: quote.id,
    templateId: proposalTemplate.id,
  });
  const sentProposal = await sendProposal(
    proposal.id,
    business.id,
    null,
    `implementation-client-${suffix}@example.com`,
  );
  assert(sentProposal.deliveryToken, "proposal token missing");
  await acceptProposal(sentProposal.deliveryToken!, {
    acceptedByName: "Alex Customer",
    acceptedByEmail: `implementation-client-${suffix}@example.com`,
  });

  const contract = await generateContractFromProposal(business.id, null, {
    proposalId: proposal.id,
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
    signedByName: "Alex Customer",
    signedByEmail: `implementation-client-${suffix}@example.com`,
    provider: "MANUAL",
  });

  console.log("Auto-provision on contract activation");
  await activateContract(contract.id, business.id, null, {
    customerName: `Alex Customer ${suffix}`,
    customerEmail: `activated-implementation-${suffix}@example.com`,
    customerPhone: `07${suffix.slice(-9).padStart(9, "6")}`,
  });

  const projectRecord = await prisma.implementationProject.findUnique({
    where: { contractId: contract.id },
    include: {
      milestones: true,
      tasks: true,
      goLiveChecklist: true,
      hypercare: true,
    },
  });
  assert(projectRecord, "implementation project missing");
  assert(projectRecord.status === "IN_PROGRESS", "project should be in progress");
  assert(projectRecord.templateId, "template should be applied");
  assert(projectRecord.portalToken, "portal token missing");
  assert(projectRecord.milestones.length >= 4, "milestones not generated");
  assert(projectRecord.tasks.length >= 4, "tasks not generated");
  assert(projectRecord.goLiveChecklist.length >= 1, "go-live checklist missing");
  console.log("  PASS");

  const project = await getImplementationProject(projectRecord.id, business.id);
  assert(project.milestoneCount >= 4, "project milestone count mismatch");
  assert(project.taskCount >= 4, "project task count mismatch");
  console.log("  PASS");

  console.log("Risk and issue register");
  await createImplementationRisk(projectRecord.id, business.id, null, {
    title: "Data migration delay",
    severity: "HIGH",
  });
  await createImplementationIssue(projectRecord.id, business.id, null, {
    title: "Missing menu photos",
    reportedByCustomer: true,
  });
  console.log("  PASS");

  console.log("Change requests");
  await createChangeRequest(projectRecord.id, business.id, null, {
    title: "Add extra training session",
    requestedByName: "Alex Customer",
  });
  console.log("  PASS");

  console.log("Customer portal");
  const portal = await getImplementationPortalView(projectRecord.portalToken!);
  assert(portal.project.id === projectRecord.id, "portal project mismatch");
  assert(portal.milestones.length >= 1, "portal milestones missing");
  assert(portal.tasks.length >= 1, "portal tasks missing");
  console.log("  PASS");

  console.log("Go-live blocked until checklist complete");
  let goLiveBlocked = false;
  try {
    await executeGoLive(projectRecord.id, business.id, null);
  } catch (error) {
    goLiveBlocked =
      error instanceof Error &&
      error.message.includes("Mandatory go-live checklist items must be completed");
  }
  assert(goLiveBlocked, "go-live should be blocked with incomplete checklist");
  console.log("  PASS");

  console.log("Complete checklist and go-live");
  for (const item of projectRecord.goLiveChecklist) {
    await completeGoLiveChecklistItem(item.id, business.id, null);
  }

  for (const task of projectRecord.tasks.filter((task) => task.isMandatoryForGoLive)) {
    await updateImplementationTaskStatus(task.id, business.id, null, "COMPLETED");
  }

  const liveProject = await executeGoLive(projectRecord.id, business.id, null);
  assert(liveProject.status === "HYPERCARE", "project should enter hypercare");
  assert(liveProject.hypercareActive, "hypercare should be active");
  assert(liveProject.goLiveAt, "go-live timestamp missing");

  const hypercare = await prisma.implementationHypercare.findUnique({
    where: { projectId: projectRecord.id },
  });
  assert(hypercare, "hypercare record missing");
  assert(hypercare.status === "ACTIVE", "hypercare status should be active");
  const hypercareDays = Math.round(
    (hypercare.endsAt.getTime() - hypercare.startedAt.getTime()) / 86400000,
  );
  assert(hypercareDays === IMPLEMENTATION_HYPERCARE_DAYS, "hypercare should last 30 days");
  console.log("  PASS");

  console.log("Project listing");
  const projects = await listImplementationProjects(business.id);
  assert(
    projects.some((entry) => entry.id === projectRecord.id),
    "project listing failed",
  );
  console.log("  PASS");

  console.log("\nCustomer Implementation & Project Delivery verification complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "@prisma/client";

import { PERMISSION_CODES } from "../src/modules/authorization/constants/permissions";
import { SALES_CRM_ROUTES } from "../src/modules/sales-crm/constants/routes";
import { formatSalesMoney } from "../src/modules/sales-crm/utils/sales-utils";
import {
  createCommercialProduct,
  createCommercialBundle,
} from "../src/services/commercial-catalogue.service";
import {
  convertLeadToOpportunity,
  createSalesCompany,
  createSalesContact,
  createSalesDemo,
  createSalesLead,
  createSalesOpportunity,
  createSalesTask,
  ensureDefaultSalesPipeline,
  getActivityTimeline,
  getSalesDashboard,
  getSalesOpportunity,
  listSalesOpportunities,
  logSalesActivity,
  moveOpportunityStage,
  updatePipelineStages,
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
    "src/modules/sales-crm/index.ts",
    "src/modules/sales-crm/constants/routes.ts",
    "src/modules/sales-crm/utils/sales-utils.ts",
    "src/modules/sales-crm/utils/sales-audit.ts",
    "src/modules/sales-crm/lib/get-sales-crm-context.ts",
    "src/modules/sales-crm/actions/sales-crm-actions.ts",
    "src/modules/sales-crm/components/sales-crm-dashboard.tsx",
    "src/modules/sales-crm/components/sales-crm-lists.tsx",
    "src/modules/sales-crm/components/sales-crm-nav.tsx",
    "src/services/sales-crm.service.ts",
    "src/app/dashboard/sales-crm/page.tsx",
    "src/app/dashboard/sales-crm/pipeline/page.tsx",
    "src/app/dashboard/sales-crm/leads/page.tsx",
    "src/app/dashboard/sales-crm/companies/page.tsx",
    "src/app/dashboard/sales-crm/contacts/page.tsx",
    "src/app/dashboard/sales-crm/opportunities/page.tsx",
    "src/app/dashboard/sales-crm/activities/page.tsx",
    "src/app/dashboard/sales-crm/tasks/page.tsx",
    "src/app/dashboard/sales-crm/demos/page.tsx",
  ];

  for (const file of moduleFiles) {
    readFileSync(join(root, file), "utf8");
  }
  console.log("  PASS");

  console.log("Sales CRM routes");
  assert(SALES_CRM_ROUTES.overview === "/dashboard/sales-crm", "sales route mismatch");
  console.log("  PASS");

  console.log("Permission protected");
  const contextSource = readFileSync(
    join(root, "src/modules/sales-crm/lib/get-sales-crm-context.ts"),
    "utf8",
  );
  const actionsSource = readFileSync(
    join(root, "src/modules/sales-crm/actions/sales-crm-actions.ts"),
    "utf8",
  );
  assert(contextSource.includes("protectedPage"), "sales pages should use protectedPage");
  assert(contextSource.includes("PERMISSION_CODES.SALES_VIEW"), "sales.view required");
  assert(actionsSource.includes("protectedAction"), "sales actions should use protectedAction");
  assert(actionsSource.includes("PERMISSION_CODES.SALES_CREATE"), "sales.create required");
  assert(actionsSource.includes("PERMISSION_CODES.SALES_MANAGE"), "sales.manage required");
  assert(PERMISSION_CODES.SALES_VIEW === "sales.view", "sales.view code missing");
  assert(PERMISSION_CODES.SALES_MANAGE === "sales.manage", "sales.manage code missing");
  console.log("  PASS");

  console.log("Integer pence formatting");
  assertGbpFormat(formatSalesMoney(250000));
  console.log("  PASS");

  console.log("Schema");
  const schemaSource = readFileSync(join(root, "prisma/schema.prisma"), "utf8");
  assert(schemaSource.includes("model SalesPipeline"), "SalesPipeline model missing");
  assert(schemaSource.includes("model SalesOpportunity"), "SalesOpportunity model missing");
  assert(schemaSource.includes("preparedQuoteId"), "prepared quote relationship missing");
  assert(
    schemaSource.includes("model SalesOpportunityCatalogueLink"),
    "catalogue link model missing",
  );
  assert(/valuePence\s+Int/.test(schemaSource), "opportunity value must be integer pence");
  console.log("  PASS");

  const business = await prisma.business.findFirst({
    select: { id: true },
  });
  assert(business, "No business found");

  const suffix = Date.now().toString();

  console.log("Default pipeline");
  const pipeline = await ensureDefaultSalesPipeline(business.id);
  assert(pipeline.isDefault, "default pipeline expected");
  assert(pipeline.stages.length >= 7, "default stages missing");
  console.log("  PASS");

  console.log("Configurable pipeline stages");
  const customStageName = `Custom Stage ${suffix}`;
  const updatedPipeline = await updatePipelineStages(pipeline.id, business.id, null, [
    ...pipeline.stages.map((stage) => ({
      id: stage.id,
      name: stage.name,
      slug: stage.slug,
      sortOrder: stage.sortOrder,
      probabilityBps: stage.probabilityBps,
      isWon: stage.isWon,
      isLost: stage.isLost,
      isActive: stage.isActive,
    })),
    {
      name: customStageName,
      slug: `custom-${suffix}`,
      sortOrder: pipeline.stages.length,
      probabilityBps: 5500,
    },
  ]);
  assert(
    updatedPipeline.stages.some((stage) => stage.name === customStageName),
    "custom stage not added",
  );
  console.log("  PASS");

  console.log("Company and contact management");
  const company = await createSalesCompany(business.id, null, {
    name: `Sales Co ${suffix}`,
    industry: "Hospitality",
    email: `sales-co-${suffix}@example.com`,
  });
  const contact = await createSalesContact(business.id, null, {
    companyId: company.id,
    firstName: "Alex",
    lastName: `Buyer ${suffix}`,
    email: `buyer-${suffix}@example.com`,
    jobTitle: "Operations Director",
  });
  assert(company.contactCount === 0, "company counts should be computed on list");
  console.log("  PASS");

  console.log("Lead management");
  const lead = await createSalesLead(business.id, null, {
    title: `Enterprise lead ${suffix}`,
    companyId: company.id,
    contactId: contact.id,
    source: "REFERRAL",
    estimatedValuePence: 150000,
    notes: "High intent lead",
  });
  assertIntegerPenceValue(lead.estimatedValuePence, "lead value");
  console.log("  PASS");

  console.log("Commercial catalogue links on opportunity");
  const product = await createCommercialProduct(business.id, null, {
    sku: `SALES-PROD-${suffix}`,
    name: `Sales Product ${suffix}`,
    pricingModel: "MONTHLY",
    basePricePence: 9900,
    assignedDepartment: "Implementation",
  });
  const implementationProduct = await createCommercialProduct(business.id, null, {
    sku: `SALES-IMPL-${suffix}`,
    name: `Implementation Package ${suffix}`,
    pricingModel: "ONE_TIME",
    basePricePence: 50000,
    setupRequired: true,
    assignedDepartment: "Professional Services",
  });
  const managedService = await createCommercialProduct(business.id, null, {
    sku: `SALES-MS-${suffix}`,
    name: `Managed Service ${suffix}`,
    pricingModel: "MONTHLY",
    basePricePence: 25000,
    renewable: true,
    assignedDepartment: "Managed Services",
  });
  assert(product.currentVersion, "product version missing");
  assert(implementationProduct.currentVersion, "implementation product version missing");
  assert(managedService.currentVersion, "managed service version missing");

  const bundle = await createCommercialBundle(business.id, null, {
    sku: `SALES-BUNDLE-${suffix}`,
    name: `Sales Bundle ${suffix}`,
    bundlePricePence: 120000,
    items: [
      {
        productVersionId: product.currentVersion!.id,
        quantity: 1,
        individualPricePence: 9900,
      },
    ],
  });
  assert(bundle.currentVersion, "bundle version missing");

  const opportunity = await createSalesOpportunity(business.id, null, {
    companyId: company.id,
    contactId: contact.id,
    name: `Opportunity ${suffix}`,
    valuePence: 275000,
    catalogueLinks: [
      { linkType: "PRODUCT", productVersionId: product.currentVersion!.id },
      { linkType: "BUNDLE", bundleVersionId: bundle.currentVersion!.id },
      {
        linkType: "IMPLEMENTATION_PACKAGE",
        productVersionId: implementationProduct.currentVersion!.id,
      },
      { linkType: "MANAGED_SERVICE", productVersionId: managedService.currentVersion!.id },
    ],
  });
  assert(opportunity.catalogueLinks.length === 4, "catalogue links missing");
  assert(
    opportunity.catalogueLinks.some((link) => link.linkType === "IMPLEMENTATION_PACKAGE"),
    "implementation package link missing",
  );
  assert(
    opportunity.preparedQuoteId === null && opportunity.preparedInvoiceId === null,
    "future document relationships should remain unset",
  );
  console.log("  PASS");

  console.log("Pipeline stage movement");
  const qualifiedStage = updatedPipeline.stages.find((stage) => stage.slug === "qualified");
  assert(qualifiedStage, "qualified stage missing");
  const moved = await moveOpportunityStage(opportunity.id, business.id, null, qualifiedStage.id);
  assert(moved.stageId === qualifiedStage.id, "stage move failed");
  console.log("  PASS");

  console.log("Lead conversion");
  const leadToConvert = await createSalesLead(business.id, null, {
    title: `Convert me ${suffix}`,
    companyId: company.id,
    estimatedValuePence: 80000,
  });
  const converted = await convertLeadToOpportunity(leadToConvert.id, business.id, null, {
    valuePence: 80000,
  });
  assert(converted.id !== opportunity.id, "converted opportunity should be new");
  console.log("  PASS");

  console.log("Activity timeline");
  await logSalesActivity(business.id, null, {
    opportunityId: opportunity.id,
    companyId: company.id,
    contactId: contact.id,
    activityType: "CALL",
    title: "Discovery call completed",
    description: "Confirmed requirements",
  });
  const timeline = await getActivityTimeline(business.id, { opportunityId: opportunity.id });
  assert(timeline.length >= 2, "timeline should include opportunity activities");
  console.log("  PASS");

  console.log("Tasks and demos");
  await createSalesTask(business.id, null, {
    leadId: lead.id,
    title: "Follow up on pricing",
    dueAt: new Date(Date.now() + 86400000),
    priority: "HIGH",
  });
  await createSalesDemo(business.id, null, {
    opportunityId: opportunity.id,
    scheduledAt: new Date(Date.now() + 172800000),
    durationMinutes: 45,
    notes: "Product walkthrough",
  });
  console.log("  PASS");

  console.log("Sales dashboard");
  const dashboard = await getSalesDashboard(business.id);
  assert(dashboard.totalLeads >= 2, "dashboard lead count missing");
  assert(dashboard.totalOpportunities >= 2, "dashboard opportunity count missing");
  assertIntegerPenceValue(dashboard.openOpportunityValuePence, "open pipeline value");
  console.log("  PASS");

  console.log("Opportunity fetch");
  const fetched = await getSalesOpportunity(opportunity.id, business.id);
  assert(fetched.catalogueLinks.length === 4, "fetched opportunity links missing");
  const listed = await listSalesOpportunities(business.id);
  assert(
    listed.some((item) => item.id === opportunity.id),
    "listed opportunity missing",
  );
  console.log("  PASS");

  console.log("\nSales CRM verification complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

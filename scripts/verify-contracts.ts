import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "@prisma/client";

import { PERMISSION_CODES } from "../src/modules/authorization/constants/permissions";
import { CONTRACTS_ROUTES } from "../src/modules/contracts/constants/routes";
import { formatContractMoney } from "../src/modules/contracts/utils/contract-utils";
import {
  activateContract,
  addContractDocument,
  createContractRevision,
  createLegalClause,
  ensureDefaultContractTypes,
  generateContractFromProposal,
  getContract,
  listContractVersions,
  listLegalClauses,
  recordContractSignature,
  requestContractApproval,
  reviewContractApproval,
  scheduleContractRenewal,
} from "../src/services/contracts.service";
import { createCommercialProduct } from "../src/services/commercial-catalogue.service";
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

function assertGbpFormat(value: string): void {
  assert(value.includes("£"), "formatted value should use GBP symbol");
}

async function main() {
  console.log("Module structure");
  const moduleFiles = [
    "src/modules/contracts/index.ts",
    "src/modules/contracts/constants/routes.ts",
    "src/modules/contracts/utils/contract-utils.ts",
    "src/modules/contracts/utils/contract-audit.ts",
    "src/modules/contracts/lib/get-contracts-context.ts",
    "src/modules/contracts/actions/contracts-actions.ts",
    "src/modules/contracts/components/contracts-dashboard.tsx",
    "src/modules/contracts/components/contracts-lists.tsx",
    "src/modules/contracts/components/contracts-nav.tsx",
    "src/services/contracts.service.ts",
    "src/app/dashboard/contracts/page.tsx",
    "src/app/dashboard/contracts/list/page.tsx",
    "src/app/dashboard/contracts/types/page.tsx",
    "src/app/dashboard/contracts/clauses/page.tsx",
    "src/app/dashboard/contracts/documents/page.tsx",
    "src/app/dashboard/contracts/renewals/page.tsx",
  ];

  for (const file of moduleFiles) {
    readFileSync(join(root, file), "utf8");
  }
  console.log("  PASS");

  console.log("Contracts routes");
  assert(CONTRACTS_ROUTES.overview === "/dashboard/contracts", "contracts route mismatch");
  console.log("  PASS");

  console.log("Permission protected");
  const contextSource = readFileSync(
    join(root, "src/modules/contracts/lib/get-contracts-context.ts"),
    "utf8",
  );
  const actionsSource = readFileSync(
    join(root, "src/modules/contracts/actions/contracts-actions.ts"),
    "utf8",
  );
  assert(contextSource.includes("protectedPage"), "contracts pages should use protectedPage");
  assert(contextSource.includes("PERMISSION_CODES.CONTRACTS_VIEW"), "contracts.view required");
  assert(actionsSource.includes("protectedAction"), "contracts actions should use protectedAction");
  assert(actionsSource.includes("PERMISSION_CODES.CONTRACTS_CREATE"), "contracts.create required");
  assert(
    actionsSource.includes("PERMISSION_CODES.CONTRACTS_ACTIVATE"),
    "contracts.activate required",
  );
  assert(actionsSource.includes("PERMISSION_CODES.CLAUSES_MANAGE"), "clauses.manage required");
  assert(PERMISSION_CODES.CONTRACTS_VIEW === "contracts.view", "contracts.view code missing");
  console.log("  PASS");

  console.log("Schema");
  const schemaSource = readFileSync(join(root, "prisma/schema.prisma"), "utf8");
  assert(schemaSource.includes("model Contract"), "Contract model missing");
  assert(schemaSource.includes("model LegalClause"), "LegalClause model missing");
  assert(schemaSource.includes("model CustomerActivation"), "CustomerActivation model missing");
  assert(schemaSource.includes("preparedFirstInvoiceId"), "prepared invoice relationship missing");
  assert(schemaSource.includes("ContractSignatureProvider"), "signature provider enum missing");
  assert(schemaSource.includes("totalPence          Int"), "contract total must be integer pence");
  console.log("  PASS");

  const business = await prisma.business.findFirst({ select: { id: true } });
  assert(business, "No business found");

  const suffix = Date.now().toString();

  console.log("Contract types and legal clauses");
  const types = await ensureDefaultContractTypes(business.id);
  assert(types.length >= 4, "default contract types missing");

  const clause = await createLegalClause(business.id, null, {
    category: "General",
    title: `Governing Law ${suffix}`,
    content: "This agreement is governed by the laws of England and Wales.",
  });
  const clauses = await listLegalClauses(business.id);
  assert(
    clauses.some((item) => item.id === clause.id),
    "legal clause missing",
  );
  console.log("  PASS");

  await ensureDefaultSalesPipeline(business.id);
  const company = await createSalesCompany(business.id, null, {
    name: `Contract Co ${suffix}`,
    email: `contract-co-${suffix}@example.com`,
  });
  const contact = await createSalesContact(business.id, null, {
    companyId: company.id,
    firstName: "Taylor",
    lastName: `Client ${suffix}`,
    email: `contract-client-${suffix}@example.com`,
    phone: `07${suffix.slice(-9).padStart(9, "3")}`,
  });
  const opportunity = await createSalesOpportunity(business.id, null, {
    companyId: company.id,
    contactId: contact.id,
    name: `Contract Opportunity ${suffix}`,
    valuePence: 120000,
  });

  const product = await createCommercialProduct(business.id, null, {
    sku: `CONTRACT-PROD-${suffix}`,
    name: `Contract Product ${suffix}`,
    pricingModel: "MONTHLY",
    basePricePence: 15000,
  });
  assert(product.currentVersion, "product version missing");

  const quote = await createQuote(business.id, null, {
    opportunityId: opportunity.id,
    title: `Contract Quote ${suffix}`,
    lineItems: [
      {
        lineType: "PRODUCT",
        productVersionId: product.currentVersion!.id,
        unitPricePence: 15000,
        quantity: 1,
        billingCycle: "MONTHLY",
      },
      {
        lineType: "CUSTOM",
        customName: "Onboarding package",
        unitPricePence: 25000,
        billingCycle: "ONE_TIME",
      },
    ],
  });

  await requestQuoteApproval(quote.id, business.id, null);
  await reviewQuoteApproval(quote.id, business.id, null, { approved: true });

  const template = await createProposalTemplate(business.id, null, {
    name: `Contract Proposal Template ${suffix}`,
    termsTemplate: "Standard commercial terms apply.",
  });
  const proposal = await generateProposalFromQuote(business.id, null, {
    quoteId: quote.id,
    templateId: template.id,
  });
  const sentProposal = await sendProposal(
    proposal.id,
    business.id,
    null,
    `contract-client-${suffix}@example.com`,
  );
  assert(sentProposal.deliveryToken, "proposal token missing");
  await acceptProposal(sentProposal.deliveryToken!, {
    acceptedByName: "Taylor Client",
    acceptedByEmail: `contract-client-${suffix}@example.com`,
  });

  console.log("Generate contract from accepted proposal");
  const contract = await generateContractFromProposal(business.id, null, {
    proposalId: proposal.id,
    contractTypeId: types[0]?.id,
    legalClauseIds: [clause.id],
    endDate: new Date(Date.now() + 365 * 86400000),
  });
  assert(contract.currentVersion, "contract version missing");
  assert(contract.currentVersion.lineItems.length === 2, "commercial line items missing");
  assert(contract.currentVersion.clauses.length >= 2, "legal clauses missing");
  assertGbpFormat(formatContractMoney(contract.currentVersion.totalPence));

  const linkedOpportunity = await prisma.salesOpportunity.findUnique({
    where: { id: opportunity.id },
    select: { preparedContractId: true },
  });
  assert(
    linkedOpportunity?.preparedContractId === contract.id,
    "opportunity contract link missing",
  );
  console.log("  PASS");

  console.log("Revision history");
  const revised = await createContractRevision(contract.id, business.id, null, {
    title: `Contract ${suffix} v2`,
  });
  assert(revised.versionCount === 2, "contract revision missing");
  const versions = await listContractVersions(contract.id, business.id);
  assert(versions.length === 2, "contract versions missing");
  console.log("  PASS");

  console.log("Approval workflow");
  await requestContractApproval(contract.id, business.id, null, "Legal review complete");
  const approved = await reviewContractApproval(contract.id, business.id, null, {
    approved: true,
  });
  assert(approved.status === "PENDING_SIGNATURE", "contract should await signatures");
  console.log("  PASS");

  console.log("Signature tracking");
  await recordContractSignature(contract.id, business.id, null, {
    party: "INTERNAL",
    signedByName: "Internal Signatory",
    signedByEmail: "legal@busal.test",
    provider: "MANUAL",
  });
  await recordContractSignature(contract.id, business.id, null, {
    party: "CUSTOMER",
    signedByName: "Taylor Client",
    signedByEmail: `contract-client-${suffix}@example.com`,
    provider: "MANUAL",
    externalReference: null,
  });
  const signed = await getContract(contract.id, business.id);
  assert(
    signed.signatures.every((signature) => signature.status === "SIGNED"),
    "signatures should be complete",
  );
  console.log("  PASS");

  console.log("Document repository");
  await addContractDocument(contract.id, business.id, null, {
    name: "Signed Agreement",
    fileName: `contract-${suffix}.pdf`,
    mimeType: "application/pdf",
    storageKey: `contracts/${contract.id}/v1.pdf`,
  });
  console.log("  PASS");

  console.log("Contract renewals");
  await scheduleContractRenewal(contract.id, business.id, null, {
    renewalDate: new Date(Date.now() + 330 * 86400000),
    newEndDate: new Date(Date.now() + 730 * 86400000),
    notes: "Annual renewal",
  });
  console.log("  PASS");

  console.log("Customer activation");
  const activated = await activateContract(contract.id, business.id, null, {
    customerName: `Taylor Client ${suffix}`,
    customerEmail: `activated-${suffix}@example.com`,
    customerPhone: `07${suffix.slice(-9).padStart(9, "4")}`,
  });
  assert(activated.status === "ACTIVE", "contract should be active");
  assert(activated.activation, "activation record missing");
  assert(activated.activation!.activatedProducts.length === 2, "activated products missing");
  assert(
    activated.activation!.preparedFirstInvoiceId != null,
    "prepared invoice should be generated on activation",
  );

  const project = await prisma.implementationProject.findUnique({
    where: { contractId: contract.id },
  });
  assert(project, "implementation project missing");
  console.log("  PASS");

  console.log("\nContracts & Customer Activation verification complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

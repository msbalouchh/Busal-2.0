import "server-only";

import type {
  ActivatedProductStatus,
  ContractRenewalStatus,
  ContractSignatureParty,
  ContractSignatureProvider,
  ContractSignatureStatus,
  ContractStatus,
  Prisma,
  QuoteBillingCycle,
  QuoteLineType,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { runInteractiveTransaction } from "@/lib/prisma-transaction";
import { logContractAudit } from "@/modules/contracts/utils/contract-audit";
import { createCustomer } from "@/services/crm.service";
import { provisionImplementationProject } from "@/services/implementation-delivery.service";
import { provisionCustomerAccountProfile } from "@/services/customer-success.service";
import { generateInvoiceFromContract } from "@/services/revops.service";

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const DEFAULT_CONTRACT_TYPES = [
  {
    name: "SaaS Subscription",
    slug: "saas-subscription",
    description: "Software subscription agreements",
  },
  {
    name: "Professional Services",
    slug: "professional-services",
    description: "Services and implementation",
  },
  {
    name: "Managed Services",
    slug: "managed-services",
    description: "Ongoing managed service contracts",
  },
  {
    name: "Mixed Agreement",
    slug: "mixed-agreement",
    description: "Combined product and services",
  },
] as const;

export interface ContractTypeData {
  id: string;
  businessId: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
}

export interface LegalClauseData {
  id: string;
  businessId: string;
  category: string;
  title: string;
  slug: string;
  content: string;
  isActive: boolean;
  sortOrder: number;
}

export interface ContractLineItemData {
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
  billingCycle: QuoteBillingCycle;
  sortOrder: number;
}

export interface ContractClauseData {
  id: string;
  legalClauseId: string | null;
  title: string;
  content: string;
  sortOrder: number;
}

export interface ContractVersionData {
  id: string;
  versionNumber: number;
  title: string;
  summary: string | null;
  subtotalPence: number;
  discountPence: number;
  taxPence: number;
  totalPence: number;
  lineItems: ContractLineItemData[];
  clauses: ContractClauseData[];
  createdAt: Date;
}

export interface ContractSignatureData {
  id: string;
  party: ContractSignatureParty;
  status: ContractSignatureStatus;
  provider: ContractSignatureProvider;
  externalReference: string | null;
  signedByName: string | null;
  signedByEmail: string | null;
  signedAt: Date | null;
}

export interface ContractDocumentData {
  id: string;
  name: string;
  fileName: string;
  mimeType: string;
  storageKey: string;
  versionNumber: number;
  createdAt: Date;
}

export interface ContractRenewalData {
  id: string;
  status: ContractRenewalStatus;
  renewalDate: Date;
  previousEndDate: Date | null;
  newEndDate: Date | null;
  notes: string | null;
}

export interface CustomerActivationData {
  id: string;
  customerId: string;
  customerName: string;
  implementationProjectId: string;
  customerSuccessManagerId: string | null;
  preparedFirstInvoiceId: string | null;
  activatedAt: Date;
  activatedProducts: Array<{
    id: string;
    name: string;
    lineType: QuoteLineType;
    status: ActivatedProductStatus;
  }>;
}

export interface ContractData {
  id: string;
  businessId: string;
  contractNumber: string;
  contractTypeId: string;
  contractTypeName: string;
  opportunityId: string;
  opportunityName: string;
  quoteId: string;
  proposalId: string;
  status: ContractStatus;
  currency: string;
  startDate: Date | null;
  endDate: Date | null;
  renewalDate: Date | null;
  currentVersion: ContractVersionData | null;
  versionCount: number;
  signatures: ContractSignatureData[];
  documents: ContractDocumentData[];
  renewals: ContractRenewalData[];
  activation: CustomerActivationData | null;
}

export interface ContractsDashboardData {
  totalContracts: number;
  draftContracts: number;
  pendingApprovalContracts: number;
  activeContracts: number;
  pendingSignatureContracts: number;
  totalContractValuePence: number;
  upcomingRenewals: number;
}

type ContractVersionWithDetails = Prisma.ContractVersionGetPayload<{
  include: {
    lineItems: { include: { productVersion: true; bundleVersion: true } };
    clauses: true;
  };
}>;

function mapContractVersion(version: ContractVersionWithDetails): ContractVersionData {
  return {
    id: version.id,
    versionNumber: version.versionNumber,
    title: version.title,
    summary: version.summary,
    subtotalPence: version.subtotalPence,
    discountPence: version.discountPence,
    taxPence: version.taxPence,
    totalPence: version.totalPence,
    lineItems: version.lineItems.map((line) => ({
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
      billingCycle: line.billingCycle,
      sortOrder: line.sortOrder,
    })),
    clauses: version.clauses.map((clause) => ({
      id: clause.id,
      legalClauseId: clause.legalClauseId,
      title: clause.title,
      content: clause.content,
      sortOrder: clause.sortOrder,
    })),
    createdAt: version.createdAt,
  };
}

async function nextContractNumber(businessId: string): Promise<string> {
  const count = await prisma.contract.count({ where: { businessId } });
  const year = new Date().getFullYear();
  return `C-${year}-${String(count + 1).padStart(4, "0")}`;
}

async function loadContract(contractId: string, businessId: string): Promise<ContractData> {
  const contract = await prisma.contract.findFirst({
    where: { id: contractId, businessId, deletedAt: null },
    include: {
      contractType: true,
      opportunity: true,
      currentVersion: {
        include: {
          lineItems: {
            include: { productVersion: true, bundleVersion: true },
            orderBy: { sortOrder: "asc" },
          },
          clauses: { orderBy: { sortOrder: "asc" } },
        },
      },
      signatures: { orderBy: { createdAt: "asc" } },
      documents: { orderBy: { createdAt: "desc" } },
      renewals: { orderBy: { renewalDate: "asc" } },
      activation: {
        include: {
          customer: true,
          activatedProducts: true,
        },
      },
      _count: { select: { versions: true } },
    },
  });

  if (!contract) {
    throw new Error("Contract not found");
  }

  return {
    id: contract.id,
    businessId: contract.businessId,
    contractNumber: contract.contractNumber,
    contractTypeId: contract.contractTypeId,
    contractTypeName: contract.contractType.name,
    opportunityId: contract.opportunityId,
    opportunityName: contract.opportunity.name,
    quoteId: contract.quoteId,
    proposalId: contract.proposalId,
    status: contract.status,
    currency: contract.currency,
    startDate: contract.startDate,
    endDate: contract.endDate,
    renewalDate: contract.renewalDate,
    currentVersion: contract.currentVersion ? mapContractVersion(contract.currentVersion) : null,
    versionCount: contract._count.versions,
    signatures: contract.signatures.map((signature) => ({
      id: signature.id,
      party: signature.party,
      status: signature.status,
      provider: signature.provider,
      externalReference: signature.externalReference,
      signedByName: signature.signedByName,
      signedByEmail: signature.signedByEmail,
      signedAt: signature.signedAt,
    })),
    documents: contract.documents.map((document) => ({
      id: document.id,
      name: document.name,
      fileName: document.fileName,
      mimeType: document.mimeType,
      storageKey: document.storageKey,
      versionNumber: document.versionNumber,
      createdAt: document.createdAt,
    })),
    renewals: contract.renewals.map((renewal) => ({
      id: renewal.id,
      status: renewal.status,
      renewalDate: renewal.renewalDate,
      previousEndDate: renewal.previousEndDate,
      newEndDate: renewal.newEndDate,
      notes: renewal.notes,
    })),
    activation: contract.activation
      ? {
          id: contract.activation.id,
          customerId: contract.activation.customerId,
          customerName: contract.activation.customer.name,
          implementationProjectId: contract.activation.implementationProjectId,
          customerSuccessManagerId: contract.activation.customerSuccessManagerId,
          preparedFirstInvoiceId: contract.activation.preparedFirstInvoiceId,
          activatedAt: contract.activation.activatedAt,
          activatedProducts: contract.activation.activatedProducts.map((product) => ({
            id: product.id,
            name: product.name,
            lineType: product.lineType,
            status: product.status,
          })),
        }
      : null,
  };
}

export async function ensureDefaultContractTypes(businessId: string): Promise<ContractTypeData[]> {
  const existing = await prisma.contractType.findMany({
    where: { businessId, isActive: true },
    orderBy: { name: "asc" },
  });

  if (existing.length >= DEFAULT_CONTRACT_TYPES.length) {
    return existing.map((type) => ({
      id: type.id,
      businessId: type.businessId,
      name: type.name,
      slug: type.slug,
      description: type.description,
      isActive: type.isActive,
    }));
  }

  for (const type of DEFAULT_CONTRACT_TYPES) {
    await prisma.contractType.upsert({
      where: { businessId_slug: { businessId, slug: type.slug } },
      create: {
        businessId,
        name: type.name,
        slug: type.slug,
        description: type.description,
      },
      update: {},
    });
  }

  return ensureDefaultContractTypes(businessId);
}

export async function listContractTypes(businessId: string): Promise<ContractTypeData[]> {
  await ensureDefaultContractTypes(businessId);
  const types = await prisma.contractType.findMany({
    where: { businessId, isActive: true },
    orderBy: { name: "asc" },
  });

  return types.map((type) => ({
    id: type.id,
    businessId: type.businessId,
    name: type.name,
    slug: type.slug,
    description: type.description,
    isActive: type.isActive,
  }));
}

export async function createLegalClause(
  businessId: string,
  staffId: string | null,
  input: {
    category: string;
    title: string;
    content: string;
    sortOrder?: number;
  },
): Promise<LegalClauseData> {
  const clause = await prisma.legalClause.create({
    data: {
      businessId,
      category: input.category.trim(),
      title: input.title.trim(),
      slug: slugify(input.title),
      content: input.content.trim(),
      sortOrder: input.sortOrder ?? 0,
    },
  });

  await logContractAudit(businessId, {
    staffId,
    entityType: "legal_clause",
    entityId: clause.id,
    action: "created",
  });

  return {
    id: clause.id,
    businessId: clause.businessId,
    category: clause.category,
    title: clause.title,
    slug: clause.slug,
    content: clause.content,
    isActive: clause.isActive,
    sortOrder: clause.sortOrder,
  };
}

export async function listLegalClauses(businessId: string): Promise<LegalClauseData[]> {
  const clauses = await prisma.legalClause.findMany({
    where: { businessId, isActive: true },
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
  });

  return clauses.map((clause) => ({
    id: clause.id,
    businessId: clause.businessId,
    category: clause.category,
    title: clause.title,
    slug: clause.slug,
    content: clause.content,
    isActive: clause.isActive,
    sortOrder: clause.sortOrder,
  }));
}

export async function generateContractFromProposal(
  businessId: string,
  staffId: string | null,
  input: {
    proposalId: string;
    contractTypeId?: string;
    title?: string;
    legalClauseIds?: string[];
    startDate?: Date | null;
    endDate?: Date | null;
  },
): Promise<ContractData> {
  const proposal = await prisma.proposal.findFirst({
    where: { id: input.proposalId, businessId },
    include: {
      acceptance: true,
      currentVersion: true,
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
          opportunity: {
            include: { company: true, contact: true },
          },
        },
      },
    },
  });

  if (!proposal) {
    throw new Error("Proposal not found");
  }
  if (proposal.status !== "ACCEPTED" || proposal.acceptance?.status !== "ACCEPTED") {
    throw new Error("Proposal must be accepted before generating a contract");
  }
  if (proposal.quote.status !== "ACCEPTED") {
    throw new Error("Quote must be accepted before generating a contract");
  }
  if (!proposal.quote.currentVersion) {
    throw new Error("Quote version not found");
  }

  const contractTypes = await ensureDefaultContractTypes(businessId);
  const contractTypeId = input.contractTypeId ?? contractTypes[0]?.id;
  if (!contractTypeId) {
    throw new Error("No contract type available");
  }

  const quoteVersion = proposal.quote.currentVersion;
  const legalClauses =
    input.legalClauseIds && input.legalClauseIds.length > 0
      ? await prisma.legalClause.findMany({
          where: { businessId, id: { in: input.legalClauseIds }, isActive: true },
          orderBy: { sortOrder: "asc" },
        })
      : [];

  const proposalTerms = proposal.currentVersion?.terms ?? null;
  const contractNumber = await nextContractNumber(businessId);
  const commercialSnapshot = {
    quoteNumber: proposal.quote.quoteNumber,
    proposalTitle: proposal.currentVersion?.title ?? null,
    lineItems: quoteVersion.lineItems,
  };

  const contractId = await runInteractiveTransaction(async (tx) => {
    const created = await tx.contract.create({
      data: {
        businessId,
        contractTypeId,
        opportunityId: proposal.quote.opportunityId,
        quoteId: proposal.quoteId,
        proposalId: proposal.id,
        contractNumber,
        currency: proposal.quote.currency,
        startDate: input.startDate ?? null,
        endDate: input.endDate ?? null,
        versions: {
          create: {
            versionNumber: 1,
            title: input.title ?? proposal.currentVersion?.title ?? `Contract ${contractNumber}`,
            summary: proposal.currentVersion?.introduction ?? null,
            commercialSnapshot: commercialSnapshot as unknown as Prisma.InputJsonValue,
            subtotalPence: quoteVersion.subtotalPence,
            discountPence: quoteVersion.discountPence,
            taxPence: quoteVersion.taxPence,
            totalPence: quoteVersion.totalPence,
            createdByStaffId: staffId,
            lineItems: {
              create: quoteVersion.lineItems.map((line, index) => ({
                lineType: line.lineType,
                productVersionId: line.productVersionId,
                bundleVersionId: line.bundleVersionId,
                customName: line.customName,
                customDescription: line.customDescription,
                quantity: line.quantity,
                unitPricePence: line.unitPricePence,
                billingCycle: line.billingCycle,
                sortOrder: line.sortOrder ?? index,
              })),
            },
            clauses: {
              create: [
                ...legalClauses.map((clause, index) => ({
                  legalClauseId: clause.id,
                  title: clause.title,
                  content: clause.content,
                  sortOrder: index,
                })),
                ...(proposalTerms
                  ? [
                      {
                        title: "Proposal Terms",
                        content: proposalTerms,
                        sortOrder: legalClauses.length,
                      },
                    ]
                  : []),
              ],
            },
          },
        },
        signatures: {
          create: [
            { party: "INTERNAL", provider: "MANUAL" },
            { party: "CUSTOMER", provider: "MANUAL" },
          ],
        },
      },
      include: { versions: { take: 1 } },
    });

    const version = created.versions[0];
    if (!version) {
      throw new Error("Contract version was not created");
    }

    await tx.contract.update({
      where: { id: created.id },
      data: { currentVersionId: version.id },
    });

    await tx.salesOpportunity.update({
      where: { id: proposal.quote.opportunityId },
      data: { preparedContractId: created.id },
    });

    await tx.proposal.update({
      where: { id: proposal.id },
      data: { preparedContractId: created.id },
    });

    await logContractAudit(
      businessId,
      {
        staffId,
        entityType: "contract",
        entityId: created.id,
        action: "generated_from_proposal",
        metadata: { proposalId: proposal.id, quoteId: proposal.quoteId },
      },
      tx,
    );

    return created.id;
  });

  return loadContract(contractId, businessId);
}

export async function createContractRevision(
  contractId: string,
  businessId: string,
  staffId: string | null,
  input?: { title?: string; summary?: string | null },
): Promise<ContractData> {
  const contract = await prisma.contract.findFirst({
    where: { id: contractId, businessId, deletedAt: null },
    include: {
      currentVersion: {
        include: {
          lineItems: true,
          clauses: true,
        },
      },
      versions: { orderBy: { versionNumber: "desc" }, take: 1 },
    },
  });

  if (!contract?.currentVersion) {
    throw new Error("Contract not found");
  }

  const nextVersionNumber = (contract.versions[0]?.versionNumber ?? 0) + 1;
  const source = contract.currentVersion;

  await runInteractiveTransaction(async (tx) => {
    const version = await tx.contractVersion.create({
      data: {
        contractId,
        versionNumber: nextVersionNumber,
        title: input?.title ?? source.title,
        summary: input?.summary ?? source.summary,
        commercialSnapshot: source.commercialSnapshot ?? undefined,
        subtotalPence: source.subtotalPence,
        discountPence: source.discountPence,
        taxPence: source.taxPence,
        totalPence: source.totalPence,
        createdByStaffId: staffId,
        lineItems: {
          create: source.lineItems.map((line) => ({
            lineType: line.lineType,
            productVersionId: line.productVersionId,
            bundleVersionId: line.bundleVersionId,
            customName: line.customName,
            customDescription: line.customDescription,
            quantity: line.quantity,
            unitPricePence: line.unitPricePence,
            billingCycle: line.billingCycle,
            sortOrder: line.sortOrder,
          })),
        },
        clauses: {
          create: source.clauses.map((clause) => ({
            legalClauseId: clause.legalClauseId,
            title: clause.title,
            content: clause.content,
            sortOrder: clause.sortOrder,
          })),
        },
      },
    });

    await tx.contract.update({
      where: { id: contractId },
      data: { currentVersionId: version.id, status: "DRAFT" },
    });

    await logContractAudit(
      businessId,
      {
        staffId,
        entityType: "contract",
        entityId: contractId,
        action: "revision_created",
        metadata: { versionNumber: nextVersionNumber },
      },
      tx,
    );
  });

  return loadContract(contractId, businessId);
}

export async function getContract(contractId: string, businessId: string): Promise<ContractData> {
  return loadContract(contractId, businessId);
}

export async function listContracts(businessId: string): Promise<ContractData[]> {
  const contracts = await prisma.contract.findMany({
    where: { businessId, deletedAt: null },
    include: {
      contractType: true,
      opportunity: true,
      currentVersion: {
        include: {
          lineItems: {
            include: { productVersion: true, bundleVersion: true },
            orderBy: { sortOrder: "asc" },
          },
          clauses: { orderBy: { sortOrder: "asc" } },
        },
      },
      signatures: true,
      documents: true,
      renewals: true,
      activation: {
        include: { customer: true, activatedProducts: true },
      },
      _count: { select: { versions: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return Promise.all(contracts.map((contract) => loadContract(contract.id, businessId)));
}

export async function listContractVersions(
  contractId: string,
  businessId: string,
): Promise<ContractVersionData[]> {
  const contract = await prisma.contract.findFirst({
    where: { id: contractId, businessId, deletedAt: null },
  });
  if (!contract) {
    throw new Error("Contract not found");
  }

  const versions = await prisma.contractVersion.findMany({
    where: { contractId },
    include: {
      lineItems: {
        include: { productVersion: true, bundleVersion: true },
        orderBy: { sortOrder: "asc" },
      },
      clauses: { orderBy: { sortOrder: "asc" } },
    },
    orderBy: { versionNumber: "desc" },
  });

  return versions.map(mapContractVersion);
}

export async function requestContractApproval(
  contractId: string,
  businessId: string,
  staffId: string | null,
  requestNotes?: string | null,
): Promise<void> {
  const contract = await prisma.contract.findFirst({
    where: { id: contractId, businessId, deletedAt: null },
  });
  if (!contract) {
    throw new Error("Contract not found");
  }

  await runInteractiveTransaction(async (tx) => {
    await tx.contract.update({
      where: { id: contractId },
      data: { status: "PENDING_APPROVAL" },
    });

    await tx.contractApproval.create({
      data: {
        contractId,
        requestedByStaffId: staffId,
        requestNotes: requestNotes ?? null,
      },
    });

    await logContractAudit(
      businessId,
      { staffId, entityType: "contract", entityId: contractId, action: "approval_requested" },
      tx,
    );
  });
}

export async function reviewContractApproval(
  contractId: string,
  businessId: string,
  staffId: string | null,
  input: { approved: boolean; reviewNotes?: string | null },
): Promise<ContractData> {
  const approval = await prisma.contractApproval.findFirst({
    where: { contractId, status: "PENDING" },
    orderBy: { createdAt: "desc" },
  });
  if (!approval) {
    throw new Error("No pending approval found");
  }

  await runInteractiveTransaction(async (tx) => {
    await tx.contractApproval.update({
      where: { id: approval.id },
      data: {
        status: input.approved ? "APPROVED" : "REJECTED",
        reviewedByStaffId: staffId,
        reviewNotes: input.reviewNotes ?? null,
        reviewedAt: new Date(),
      },
    });

    await tx.contract.update({
      where: { id: contractId },
      data: { status: input.approved ? "PENDING_SIGNATURE" : "DRAFT" },
    });

    await logContractAudit(
      businessId,
      {
        staffId,
        entityType: "contract",
        entityId: contractId,
        action: input.approved ? "approved" : "rejected",
      },
      tx,
    );
  });

  return loadContract(contractId, businessId);
}

export async function recordContractSignature(
  contractId: string,
  businessId: string,
  staffId: string | null,
  input: {
    party: ContractSignatureParty;
    signedByName: string;
    signedByEmail: string;
    provider?: ContractSignatureProvider;
    externalReference?: string | null;
  },
): Promise<ContractData> {
  const signature = await prisma.contractSignature.findFirst({
    where: { contractId, party: input.party },
  });
  if (!signature) {
    throw new Error("Signature slot not found");
  }

  await runInteractiveTransaction(async (tx) => {
    await tx.contractSignature.update({
      where: { id: signature.id },
      data: {
        status: "SIGNED",
        provider: input.provider ?? "MANUAL",
        externalReference: input.externalReference ?? null,
        signedByName: input.signedByName,
        signedByEmail: input.signedByEmail,
        signedAt: new Date(),
      },
    });

    await logContractAudit(
      businessId,
      {
        staffId,
        entityType: "contract_signature",
        entityId: signature.id,
        action: "signed",
        metadata: { party: input.party, provider: input.provider ?? "MANUAL" },
      },
      tx,
    );
  });

  return loadContract(contractId, businessId);
}

export async function addContractDocument(
  contractId: string,
  businessId: string,
  staffId: string | null,
  input: {
    name: string;
    fileName: string;
    mimeType: string;
    storageKey: string;
    versionNumber?: number;
  },
): Promise<ContractDocumentData> {
  const contract = await prisma.contract.findFirst({
    where: { id: contractId, businessId, deletedAt: null },
  });
  if (!contract) {
    throw new Error("Contract not found");
  }

  const document = await prisma.contractDocument.create({
    data: {
      contractId,
      name: input.name.trim(),
      fileName: input.fileName.trim(),
      mimeType: input.mimeType.trim(),
      storageKey: input.storageKey.trim(),
      versionNumber: input.versionNumber ?? 1,
      uploadedByStaffId: staffId,
    },
  });

  await logContractAudit(businessId, {
    staffId,
    entityType: "contract_document",
    entityId: document.id,
    action: "uploaded",
  });

  return {
    id: document.id,
    name: document.name,
    fileName: document.fileName,
    mimeType: document.mimeType,
    storageKey: document.storageKey,
    versionNumber: document.versionNumber,
    createdAt: document.createdAt,
  };
}

export async function scheduleContractRenewal(
  contractId: string,
  businessId: string,
  staffId: string | null,
  input: {
    renewalDate: Date;
    newEndDate?: Date | null;
    notes?: string | null;
  },
): Promise<ContractRenewalData> {
  const contract = await prisma.contract.findFirst({
    where: { id: contractId, businessId, deletedAt: null },
  });
  if (!contract) {
    throw new Error("Contract not found");
  }

  const renewal = await runInteractiveTransaction(async (tx) => {
    const created = await tx.contractRenewal.create({
      data: {
        contractId,
        renewalDate: input.renewalDate,
        previousEndDate: contract.endDate,
        newEndDate: input.newEndDate ?? null,
        notes: input.notes ?? null,
      },
    });

    await tx.contract.update({
      where: { id: contractId },
      data: { renewalDate: input.renewalDate },
    });

    await logContractAudit(
      businessId,
      {
        staffId,
        entityType: "contract_renewal",
        entityId: created.id,
        action: "scheduled",
      },
      tx,
    );

    return created;
  });

  return {
    id: renewal.id,
    status: renewal.status,
    renewalDate: renewal.renewalDate,
    previousEndDate: renewal.previousEndDate,
    newEndDate: renewal.newEndDate,
    notes: renewal.notes,
  };
}

export async function activateContract(
  contractId: string,
  businessId: string,
  staffId: string | null,
  input: {
    customerSuccessManagerId?: string | null;
    customerName?: string;
    customerEmail?: string | null;
    customerPhone?: string | null;
  },
): Promise<ContractData> {
  const contract = await prisma.contract.findFirst({
    where: { id: contractId, businessId, deletedAt: null },
    include: {
      signatures: true,
      currentVersion: {
        include: {
          lineItems: {
            include: { productVersion: true, bundleVersion: true },
          },
        },
      },
      quote: {
        include: {
          opportunity: {
            include: { company: true, contact: true },
          },
        },
      },
    },
  });

  if (!contract?.currentVersion) {
    throw new Error("Contract not found");
  }

  const unsignedSignatures = contract.signatures.filter(
    (signature) => signature.status !== "SIGNED",
  );
  if (unsignedSignatures.length > 0) {
    throw new Error("All signatures must be completed before activation");
  }

  const opportunity = contract.quote.opportunity;
  const customerName =
    input.customerName ??
    (opportunity.contact
      ? `${opportunity.contact.firstName} ${opportunity.contact.lastName}`
      : (opportunity.company?.name ?? "Contract Customer"));
  const customerEmail =
    input.customerEmail ?? opportunity.contact?.email ?? opportunity.company?.email ?? null;
  const customerPhone =
    input.customerPhone ?? opportunity.contact?.phone ?? opportunity.company?.phone ?? null;

  const customer = await createCustomer(businessId, staffId, {
    name: customerName,
    email: customerEmail,
    phone: customerPhone,
    address: opportunity.company?.address ?? null,
    tags: ["contract-activated"],
    status: "ACTIVE",
  });

  await runInteractiveTransaction(async (tx) => {
    const projectId = await provisionImplementationProject(
      {
        businessId,
        contractId: contract.id,
        customerId: customer.id,
        name: `Implementation — ${contract.contractNumber}`,
        assignedStaffId: input.customerSuccessManagerId ?? staffId,
        industry: opportunity.company?.industry ?? "hospitality",
      },
      staffId,
      tx,
    );

    const activation = await tx.customerActivation.create({
      data: {
        businessId,
        contractId: contract.id,
        customerId: customer.id,
        implementationProjectId: projectId,
        customerSuccessManagerId: input.customerSuccessManagerId ?? staffId,
        preparedFirstInvoiceId: null,
        activatedAt: new Date(),
        activatedByStaffId: staffId,
        activatedProducts: {
          create: contract.currentVersion!.lineItems.map((line) => ({
            contractLineItemId: line.id,
            lineType: line.lineType,
            productVersionId: line.productVersionId,
            bundleVersionId: line.bundleVersionId,
            name:
              line.customName ??
              line.productVersion?.name ??
              line.bundleVersion?.name ??
              "Purchased item",
            status: "ACTIVE",
          })),
        },
      },
    });

    await tx.contract.update({
      where: { id: contractId },
      data: {
        status: "ACTIVE",
        startDate: contract.startDate ?? new Date(),
      },
    });

    await logContractAudit(
      businessId,
      {
        staffId,
        entityType: "contract",
        entityId: contractId,
        action: "activated",
        metadata: {
          customerId: customer.id,
          activationId: activation.id,
          implementationProjectId: projectId,
        },
      },
      tx,
    );

    await provisionCustomerAccountProfile(
      {
        businessId,
        customerId: customer.id,
        activationId: activation.id,
        contractId: contract.id,
        customerSuccessManagerId: input.customerSuccessManagerId ?? staffId,
        salesCompanyId: opportunity.companyId,
        salesContactId: opportunity.contactId,
        industry: opportunity.company?.industry ?? null,
        contractRenewalDate: contract.renewalDate ?? contract.endDate,
      },
      staffId,
      tx,
    );
  });

  const preparedFirstInvoiceId = await generateInvoiceFromContract(
    contract.id,
    businessId,
    staffId,
  );

  await prisma.customerActivation.updateMany({
    where: { contractId: contract.id, businessId },
    data: { preparedFirstInvoiceId },
  });

  return loadContract(contractId, businessId);
}

export async function archiveContract(
  contractId: string,
  businessId: string,
  staffId: string | null,
): Promise<ContractData> {
  const contract = await prisma.contract.findFirst({
    where: { id: contractId, businessId, deletedAt: null },
  });
  if (!contract) {
    throw new Error("Contract not found");
  }

  await runInteractiveTransaction(async (tx) => {
    await tx.contract.update({
      where: { id: contractId },
      data: { status: "ARCHIVED", archivedAt: new Date() },
    });

    await logContractAudit(
      businessId,
      { staffId, entityType: "contract", entityId: contractId, action: "archived" },
      tx,
    );
  });

  return loadContract(contractId, businessId);
}

export async function getContractsDashboard(businessId: string): Promise<ContractsDashboardData> {
  const contracts = await prisma.contract.findMany({
    where: { businessId, deletedAt: null },
    include: { currentVersion: true },
  });

  const upcomingRenewals = await prisma.contractRenewal.count({
    where: {
      contract: { businessId },
      status: "SCHEDULED",
      renewalDate: { gte: new Date() },
    },
  });

  return {
    totalContracts: contracts.length,
    draftContracts: contracts.filter((contract) => contract.status === "DRAFT").length,
    pendingApprovalContracts: contracts.filter((contract) => contract.status === "PENDING_APPROVAL")
      .length,
    activeContracts: contracts.filter((contract) => contract.status === "ACTIVE").length,
    pendingSignatureContracts: contracts.filter(
      (contract) => contract.status === "PENDING_SIGNATURE",
    ).length,
    totalContractValuePence: contracts.reduce(
      (sum, contract) => sum + (contract.currentVersion?.totalPence ?? 0),
      0,
    ),
    upcomingRenewals,
  };
}

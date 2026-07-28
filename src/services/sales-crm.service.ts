import "server-only";

import type {
  OpportunityCatalogueLinkType,
  Prisma,
  SalesActivityType,
  SalesDemoStatus,
  SalesLeadSource,
  SalesLeadStatus,
  SalesTaskPriority,
  SalesTaskStatus,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { logSalesAudit } from "@/modules/sales-crm/utils/sales-audit";

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function assertIntegerPence(value: number, label: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${label} must be a non-negative integer pence value`);
  }
}

const DEFAULT_PIPELINE_STAGES = [
  { name: "Lead", slug: "lead", sortOrder: 0, probabilityBps: 1000 },
  { name: "Qualified", slug: "qualified", sortOrder: 1, probabilityBps: 2000 },
  { name: "Demo", slug: "demo", sortOrder: 2, probabilityBps: 4000 },
  { name: "Proposal", slug: "proposal", sortOrder: 3, probabilityBps: 6000 },
  { name: "Negotiation", slug: "negotiation", sortOrder: 4, probabilityBps: 8000 },
  { name: "Won", slug: "won", sortOrder: 5, probabilityBps: 10000, isWon: true },
  { name: "Lost", slug: "lost", sortOrder: 6, probabilityBps: 0, isLost: true },
] as const;

export interface SalesPipelineStageData {
  id: string;
  pipelineId: string;
  name: string;
  slug: string;
  sortOrder: number;
  probabilityBps: number;
  isWon: boolean;
  isLost: boolean;
  isActive: boolean;
  opportunityCount: number;
}

export interface SalesPipelineData {
  id: string;
  businessId: string;
  name: string;
  isDefault: boolean;
  isActive: boolean;
  stages: SalesPipelineStageData[];
}

export interface SalesCompanyData {
  id: string;
  businessId: string;
  name: string;
  website: string | null;
  industry: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  contactCount: number;
  opportunityCount: number;
}

export interface SalesContactData {
  id: string;
  businessId: string;
  companyId: string | null;
  companyName: string | null;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  jobTitle: string | null;
}

export interface SalesLeadData {
  id: string;
  businessId: string;
  companyId: string | null;
  companyName: string | null;
  contactId: string | null;
  contactName: string | null;
  assignedStaffId: string | null;
  title: string;
  status: SalesLeadStatus;
  source: SalesLeadSource;
  estimatedValuePence: number;
  notes: string | null;
  convertedOpportunityId: string | null;
}

export interface SalesOpportunityCatalogueLinkData {
  id: string;
  linkType: OpportunityCatalogueLinkType;
  productVersionId: string | null;
  productName: string | null;
  bundleVersionId: string | null;
  bundleName: string | null;
}

export interface SalesOpportunityData {
  id: string;
  businessId: string;
  pipelineId: string;
  stageId: string;
  stageName: string;
  companyId: string | null;
  companyName: string | null;
  contactId: string | null;
  contactName: string | null;
  assignedStaffId: string | null;
  name: string;
  description: string | null;
  valuePence: number;
  currency: string;
  expectedCloseDate: Date | null;
  preparedQuoteId: string | null;
  preparedProposalId: string | null;
  preparedContractId: string | null;
  preparedInvoiceId: string | null;
  catalogueLinks: SalesOpportunityCatalogueLinkData[];
}

export interface SalesActivityData {
  id: string;
  businessId: string;
  opportunityId: string | null;
  leadId: string | null;
  companyId: string | null;
  contactId: string | null;
  staffId: string | null;
  activityType: SalesActivityType;
  title: string;
  description: string | null;
  createdAt: Date;
}

export interface SalesTaskData {
  id: string;
  businessId: string;
  opportunityId: string | null;
  leadId: string | null;
  assignedStaffId: string | null;
  title: string;
  description: string | null;
  dueAt: Date | null;
  status: SalesTaskStatus;
  priority: SalesTaskPriority;
  completedAt: Date | null;
}

export interface SalesDemoData {
  id: string;
  businessId: string;
  opportunityId: string | null;
  leadId: string | null;
  staffId: string | null;
  scheduledAt: Date;
  durationMinutes: number;
  status: SalesDemoStatus;
  notes: string | null;
}

export interface SalesDashboardData {
  totalLeads: number;
  openLeads: number;
  totalOpportunities: number;
  openOpportunityValuePence: number;
  wonOpportunityValuePence: number;
  pendingTasks: number;
  upcomingDemos: number;
  stageBreakdown: Array<{
    stageId: string;
    stageName: string;
    count: number;
    valuePence: number;
  }>;
}

export interface PipelineStageInput {
  id?: string;
  name: string;
  slug?: string;
  sortOrder: number;
  probabilityBps?: number;
  isWon?: boolean;
  isLost?: boolean;
  isActive?: boolean;
}

export interface CatalogueLinkInput {
  linkType: OpportunityCatalogueLinkType;
  productVersionId?: string | null;
  bundleVersionId?: string | null;
}

function mapPipelineStage(
  stage: Prisma.SalesPipelineStageGetPayload<{
    include: { _count: { select: { opportunities: true } } };
  }>,
): SalesPipelineStageData {
  return {
    id: stage.id,
    pipelineId: stage.pipelineId,
    name: stage.name,
    slug: stage.slug,
    sortOrder: stage.sortOrder,
    probabilityBps: stage.probabilityBps,
    isWon: stage.isWon,
    isLost: stage.isLost,
    isActive: stage.isActive,
    opportunityCount: stage._count.opportunities,
  };
}

function mapOpportunity(
  opportunity: Prisma.SalesOpportunityGetPayload<{
    include: {
      stage: true;
      company: true;
      contact: true;
      catalogueLinks: {
        include: {
          productVersion: true;
          bundleVersion: true;
        };
      };
    };
  }>,
): SalesOpportunityData {
  return {
    id: opportunity.id,
    businessId: opportunity.businessId,
    pipelineId: opportunity.pipelineId,
    stageId: opportunity.stageId,
    stageName: opportunity.stage.name,
    companyId: opportunity.companyId,
    companyName: opportunity.company?.name ?? null,
    contactId: opportunity.contactId,
    contactName: opportunity.contact
      ? `${opportunity.contact.firstName} ${opportunity.contact.lastName}`
      : null,
    assignedStaffId: opportunity.assignedStaffId,
    name: opportunity.name,
    description: opportunity.description,
    valuePence: opportunity.valuePence,
    currency: opportunity.currency,
    expectedCloseDate: opportunity.expectedCloseDate,
    preparedQuoteId: opportunity.preparedQuoteId,
    preparedProposalId: opportunity.preparedProposalId,
    preparedContractId: opportunity.preparedContractId,
    preparedInvoiceId: opportunity.preparedInvoiceId,
    catalogueLinks: opportunity.catalogueLinks.map((link) => ({
      id: link.id,
      linkType: link.linkType,
      productVersionId: link.productVersionId,
      productName: link.productVersion?.name ?? null,
      bundleVersionId: link.bundleVersionId,
      bundleName: link.bundleVersion?.name ?? null,
    })),
  };
}

export async function ensureDefaultSalesPipeline(businessId: string): Promise<SalesPipelineData> {
  const existing = await prisma.salesPipeline.findFirst({
    where: { businessId, isDefault: true },
    include: {
      stages: {
        orderBy: { sortOrder: "asc" },
        include: { _count: { select: { opportunities: true } } },
      },
    },
  });

  if (existing) {
    return {
      id: existing.id,
      businessId: existing.businessId,
      name: existing.name,
      isDefault: existing.isDefault,
      isActive: existing.isActive,
      stages: existing.stages.map(mapPipelineStage),
    };
  }

  const pipeline = await prisma.salesPipeline.create({
    data: {
      businessId,
      name: "Default Pipeline",
      isDefault: true,
      stages: {
        create: DEFAULT_PIPELINE_STAGES.map((stage) => ({
          name: stage.name,
          slug: stage.slug,
          sortOrder: stage.sortOrder,
          probabilityBps: stage.probabilityBps,
          isWon: "isWon" in stage ? stage.isWon : false,
          isLost: "isLost" in stage ? stage.isLost : false,
        })),
      },
    },
    include: {
      stages: {
        orderBy: { sortOrder: "asc" },
        include: { _count: { select: { opportunities: true } } },
      },
    },
  });

  return {
    id: pipeline.id,
    businessId: pipeline.businessId,
    name: pipeline.name,
    isDefault: pipeline.isDefault,
    isActive: pipeline.isActive,
    stages: pipeline.stages.map(mapPipelineStage),
  };
}

export async function listSalesPipelines(businessId: string): Promise<SalesPipelineData[]> {
  const pipelines = await prisma.salesPipeline.findMany({
    where: { businessId, isActive: true },
    include: {
      stages: {
        orderBy: { sortOrder: "asc" },
        include: { _count: { select: { opportunities: true } } },
      },
    },
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
  });

  return pipelines.map((pipeline) => ({
    id: pipeline.id,
    businessId: pipeline.businessId,
    name: pipeline.name,
    isDefault: pipeline.isDefault,
    isActive: pipeline.isActive,
    stages: pipeline.stages.map(mapPipelineStage),
  }));
}

export async function updatePipelineStages(
  pipelineId: string,
  businessId: string,
  staffId: string | null,
  stages: PipelineStageInput[],
): Promise<SalesPipelineData> {
  const pipeline = await prisma.salesPipeline.findFirst({
    where: { id: pipelineId, businessId },
  });
  if (!pipeline) {
    throw new Error("Pipeline not found");
  }

  await prisma.$transaction(async (tx) => {
    for (const stage of stages) {
      const slug = stage.slug ?? slugify(stage.name);
      if (stage.id) {
        await tx.salesPipelineStage.updateMany({
          where: { id: stage.id, pipelineId },
          data: {
            name: stage.name,
            slug,
            sortOrder: stage.sortOrder,
            probabilityBps: stage.probabilityBps ?? 0,
            isWon: stage.isWon ?? false,
            isLost: stage.isLost ?? false,
            isActive: stage.isActive ?? true,
          },
        });
      } else {
        await tx.salesPipelineStage.create({
          data: {
            pipelineId,
            name: stage.name,
            slug,
            sortOrder: stage.sortOrder,
            probabilityBps: stage.probabilityBps ?? 0,
            isWon: stage.isWon ?? false,
            isLost: stage.isLost ?? false,
            isActive: stage.isActive ?? true,
          },
        });
      }
    }

    await logSalesAudit(
      businessId,
      {
        staffId,
        entityType: "pipeline",
        entityId: pipelineId,
        action: "stages_updated",
        metadata: { stageCount: stages.length },
      },
      tx,
    );
  });

  const updated = await prisma.salesPipeline.findFirstOrThrow({
    where: { id: pipelineId },
    include: {
      stages: {
        orderBy: { sortOrder: "asc" },
        include: { _count: { select: { opportunities: true } } },
      },
    },
  });

  return {
    id: updated.id,
    businessId: updated.businessId,
    name: updated.name,
    isDefault: updated.isDefault,
    isActive: updated.isActive,
    stages: updated.stages.map(mapPipelineStage),
  };
}

export async function createSalesCompany(
  businessId: string,
  staffId: string | null,
  input: {
    name: string;
    website?: string | null;
    industry?: string | null;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    notes?: string | null;
  },
): Promise<SalesCompanyData> {
  const company = await prisma.salesCompany.create({
    data: {
      businessId,
      name: input.name.trim(),
      website: input.website ?? null,
      industry: input.industry ?? null,
      phone: input.phone ?? null,
      email: input.email ?? null,
      address: input.address ?? null,
      notes: input.notes ?? null,
    },
    include: {
      _count: { select: { contacts: true, opportunities: true } },
    },
  });

  await logSalesAudit(businessId, {
    staffId,
    entityType: "company",
    entityId: company.id,
    action: "created",
  });

  return {
    id: company.id,
    businessId: company.businessId,
    name: company.name,
    website: company.website,
    industry: company.industry,
    phone: company.phone,
    email: company.email,
    address: company.address,
    notes: company.notes,
    contactCount: company._count.contacts,
    opportunityCount: company._count.opportunities,
  };
}

export async function listSalesCompanies(businessId: string): Promise<SalesCompanyData[]> {
  const companies = await prisma.salesCompany.findMany({
    where: { businessId, deletedAt: null },
    include: {
      _count: { select: { contacts: true, opportunities: true } },
    },
    orderBy: { name: "asc" },
  });

  return companies.map((company) => ({
    id: company.id,
    businessId: company.businessId,
    name: company.name,
    website: company.website,
    industry: company.industry,
    phone: company.phone,
    email: company.email,
    address: company.address,
    notes: company.notes,
    contactCount: company._count.contacts,
    opportunityCount: company._count.opportunities,
  }));
}

export async function createSalesContact(
  businessId: string,
  staffId: string | null,
  input: {
    companyId?: string | null;
    firstName: string;
    lastName: string;
    email?: string | null;
    phone?: string | null;
    jobTitle?: string | null;
  },
): Promise<SalesContactData> {
  const contact = await prisma.salesContact.create({
    data: {
      businessId,
      companyId: input.companyId ?? null,
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      email: input.email ?? null,
      phone: input.phone ?? null,
      jobTitle: input.jobTitle ?? null,
    },
    include: { company: true },
  });

  await logSalesAudit(businessId, {
    staffId,
    entityType: "contact",
    entityId: contact.id,
    action: "created",
  });

  return {
    id: contact.id,
    businessId: contact.businessId,
    companyId: contact.companyId,
    companyName: contact.company?.name ?? null,
    firstName: contact.firstName,
    lastName: contact.lastName,
    email: contact.email,
    phone: contact.phone,
    jobTitle: contact.jobTitle,
  };
}

export async function listSalesContacts(businessId: string): Promise<SalesContactData[]> {
  const contacts = await prisma.salesContact.findMany({
    where: { businessId, deletedAt: null },
    include: { company: true },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  return contacts.map((contact) => ({
    id: contact.id,
    businessId: contact.businessId,
    companyId: contact.companyId,
    companyName: contact.company?.name ?? null,
    firstName: contact.firstName,
    lastName: contact.lastName,
    email: contact.email,
    phone: contact.phone,
    jobTitle: contact.jobTitle,
  }));
}

export async function createSalesLead(
  businessId: string,
  staffId: string | null,
  input: {
    title: string;
    companyId?: string | null;
    contactId?: string | null;
    assignedStaffId?: string | null;
    status?: SalesLeadStatus;
    source?: SalesLeadSource;
    estimatedValuePence?: number;
    notes?: string | null;
  },
): Promise<SalesLeadData> {
  const estimatedValuePence = input.estimatedValuePence ?? 0;
  assertIntegerPence(estimatedValuePence, "Estimated value");

  const lead = await prisma.salesLead.create({
    data: {
      businessId,
      title: input.title.trim(),
      companyId: input.companyId ?? null,
      contactId: input.contactId ?? null,
      assignedStaffId: input.assignedStaffId ?? null,
      status: input.status ?? "NEW",
      source: input.source ?? "OTHER",
      estimatedValuePence,
      notes: input.notes ?? null,
    },
    include: { company: true, contact: true },
  });

  await logSalesAudit(businessId, {
    staffId,
    entityType: "lead",
    entityId: lead.id,
    action: "created",
  });

  return {
    id: lead.id,
    businessId: lead.businessId,
    companyId: lead.companyId,
    companyName: lead.company?.name ?? null,
    contactId: lead.contactId,
    contactName: lead.contact ? `${lead.contact.firstName} ${lead.contact.lastName}` : null,
    assignedStaffId: lead.assignedStaffId,
    title: lead.title,
    status: lead.status,
    source: lead.source,
    estimatedValuePence: lead.estimatedValuePence,
    notes: lead.notes,
    convertedOpportunityId: lead.convertedOpportunityId,
  };
}

export async function listSalesLeads(businessId: string): Promise<SalesLeadData[]> {
  const leads = await prisma.salesLead.findMany({
    where: { businessId, deletedAt: null },
    include: { company: true, contact: true },
    orderBy: { createdAt: "desc" },
  });

  return leads.map((lead) => ({
    id: lead.id,
    businessId: lead.businessId,
    companyId: lead.companyId,
    companyName: lead.company?.name ?? null,
    contactId: lead.contactId,
    contactName: lead.contact ? `${lead.contact.firstName} ${lead.contact.lastName}` : null,
    assignedStaffId: lead.assignedStaffId,
    title: lead.title,
    status: lead.status,
    source: lead.source,
    estimatedValuePence: lead.estimatedValuePence,
    notes: lead.notes,
    convertedOpportunityId: lead.convertedOpportunityId,
  }));
}

async function validateCatalogueLink(businessId: string, link: CatalogueLinkInput): Promise<void> {
  if (link.linkType === "BUNDLE") {
    if (!link.bundleVersionId) {
      throw new Error("Bundle version is required for bundle links");
    }
    const bundleVersion = await prisma.commercialBundleVersion.findFirst({
      where: {
        id: link.bundleVersionId,
        bundle: { businessId },
      },
    });
    if (!bundleVersion) {
      throw new Error("Bundle version not found");
    }
    return;
  }

  if (!link.productVersionId) {
    throw new Error("Product version is required for catalogue links");
  }

  const productVersion = await prisma.commercialProductVersion.findFirst({
    where: {
      id: link.productVersionId,
      product: { businessId },
    },
  });
  if (!productVersion) {
    throw new Error("Product version not found");
  }
}

export async function createSalesOpportunity(
  businessId: string,
  staffId: string | null,
  input: {
    pipelineId?: string;
    stageId?: string;
    companyId?: string | null;
    contactId?: string | null;
    assignedStaffId?: string | null;
    name: string;
    description?: string | null;
    valuePence?: number;
    currency?: string;
    expectedCloseDate?: Date | null;
    catalogueLinks?: CatalogueLinkInput[];
  },
): Promise<SalesOpportunityData> {
  const pipeline = input.pipelineId
    ? await prisma.salesPipeline.findFirst({
        where: { id: input.pipelineId, businessId },
        include: { stages: { orderBy: { sortOrder: "asc" } } },
      })
    : null;

  const resolvedPipeline = pipeline ?? (await ensureDefaultSalesPipeline(businessId));
  const stageId =
    input.stageId ??
    resolvedPipeline.stages.find((stage) => stage.slug === "lead")?.id ??
    resolvedPipeline.stages[0]?.id;

  if (!stageId) {
    throw new Error("Pipeline has no stages");
  }

  const valuePence = input.valuePence ?? 0;
  assertIntegerPence(valuePence, "Opportunity value");

  if (input.catalogueLinks) {
    for (const link of input.catalogueLinks) {
      await validateCatalogueLink(businessId, link);
    }
  }

  const opportunity = await prisma.salesOpportunity.create({
    data: {
      businessId,
      pipelineId: resolvedPipeline.id,
      stageId,
      companyId: input.companyId ?? null,
      contactId: input.contactId ?? null,
      assignedStaffId: input.assignedStaffId ?? null,
      name: input.name.trim(),
      description: input.description ?? null,
      valuePence,
      currency: input.currency ?? "GBP",
      expectedCloseDate: input.expectedCloseDate ?? null,
      catalogueLinks: input.catalogueLinks
        ? {
            create: input.catalogueLinks.map((link) => ({
              linkType: link.linkType,
              productVersionId: link.productVersionId ?? null,
              bundleVersionId: link.bundleVersionId ?? null,
            })),
          }
        : undefined,
    },
    include: {
      stage: true,
      company: true,
      contact: true,
      catalogueLinks: {
        include: { productVersion: true, bundleVersion: true },
      },
    },
  });

  await logSalesActivity(businessId, staffId, {
    opportunityId: opportunity.id,
    companyId: opportunity.companyId,
    contactId: opportunity.contactId,
    activityType: "NOTE",
    title: "Opportunity created",
    description: opportunity.name,
  });

  await logSalesAudit(businessId, {
    staffId,
    entityType: "opportunity",
    entityId: opportunity.id,
    action: "created",
  });

  return mapOpportunity(opportunity);
}

export async function getSalesOpportunity(
  opportunityId: string,
  businessId: string,
): Promise<SalesOpportunityData> {
  const opportunity = await prisma.salesOpportunity.findFirst({
    where: { id: opportunityId, businessId, deletedAt: null },
    include: {
      stage: true,
      company: true,
      contact: true,
      catalogueLinks: {
        include: { productVersion: true, bundleVersion: true },
      },
    },
  });

  if (!opportunity) {
    throw new Error("Opportunity not found");
  }

  return mapOpportunity(opportunity);
}

export async function listSalesOpportunities(businessId: string): Promise<SalesOpportunityData[]> {
  const opportunities = await prisma.salesOpportunity.findMany({
    where: { businessId, deletedAt: null },
    include: {
      stage: true,
      company: true,
      contact: true,
      catalogueLinks: {
        include: { productVersion: true, bundleVersion: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return opportunities.map(mapOpportunity);
}

export async function moveOpportunityStage(
  opportunityId: string,
  businessId: string,
  staffId: string | null,
  stageId: string,
): Promise<SalesOpportunityData> {
  const opportunity = await prisma.salesOpportunity.findFirst({
    where: { id: opportunityId, businessId, deletedAt: null },
    include: { stage: true },
  });
  if (!opportunity) {
    throw new Error("Opportunity not found");
  }

  const stage = await prisma.salesPipelineStage.findFirst({
    where: { id: stageId, pipelineId: opportunity.pipelineId },
  });
  if (!stage) {
    throw new Error("Stage not found");
  }

  const updated = await prisma.salesOpportunity.update({
    where: { id: opportunityId },
    data: { stageId },
    include: {
      stage: true,
      company: true,
      contact: true,
      catalogueLinks: {
        include: { productVersion: true, bundleVersion: true },
      },
    },
  });

  await logSalesActivity(businessId, staffId, {
    opportunityId,
    companyId: updated.companyId,
    contactId: updated.contactId,
    activityType: "STAGE_CHANGE",
    title: `Moved to ${stage.name}`,
    description: `From ${opportunity.stage.name} to ${stage.name}`,
  });

  await logSalesAudit(businessId, {
    staffId,
    entityType: "opportunity",
    entityId: opportunityId,
    action: "stage_changed",
    metadata: { fromStageId: opportunity.stageId, toStageId: stageId },
  });

  return mapOpportunity(updated);
}

export async function linkOpportunityCatalogueItem(
  opportunityId: string,
  businessId: string,
  staffId: string | null,
  link: CatalogueLinkInput,
): Promise<SalesOpportunityData> {
  const opportunity = await prisma.salesOpportunity.findFirst({
    where: { id: opportunityId, businessId, deletedAt: null },
  });
  if (!opportunity) {
    throw new Error("Opportunity not found");
  }

  await validateCatalogueLink(businessId, link);

  await prisma.salesOpportunityCatalogueLink.create({
    data: {
      opportunityId,
      linkType: link.linkType,
      productVersionId: link.productVersionId ?? null,
      bundleVersionId: link.bundleVersionId ?? null,
    },
  });

  await logSalesAudit(businessId, {
    staffId,
    entityType: "opportunity",
    entityId: opportunityId,
    action: "catalogue_linked",
    metadata: { linkType: link.linkType },
  });

  return getSalesOpportunity(opportunityId, businessId);
}

export async function convertLeadToOpportunity(
  leadId: string,
  businessId: string,
  staffId: string | null,
  input?: {
    name?: string;
    stageId?: string;
    valuePence?: number;
    catalogueLinks?: CatalogueLinkInput[];
  },
): Promise<SalesOpportunityData> {
  const lead = await prisma.salesLead.findFirst({
    where: { id: leadId, businessId, deletedAt: null },
  });
  if (!lead) {
    throw new Error("Lead not found");
  }
  if (lead.convertedOpportunityId) {
    throw new Error("Lead already converted");
  }

  const opportunity = await createSalesOpportunity(businessId, staffId, {
    companyId: lead.companyId,
    contactId: lead.contactId,
    assignedStaffId: lead.assignedStaffId,
    name: input?.name ?? lead.title,
    valuePence: input?.valuePence ?? lead.estimatedValuePence,
    stageId: input?.stageId,
    catalogueLinks: input?.catalogueLinks,
  });

  await prisma.salesLead.update({
    where: { id: leadId },
    data: {
      status: "CONVERTED",
      convertedOpportunityId: opportunity.id,
    },
  });

  await logSalesActivity(businessId, staffId, {
    leadId,
    opportunityId: opportunity.id,
    companyId: lead.companyId,
    contactId: lead.contactId,
    activityType: "NOTE",
    title: "Lead converted to opportunity",
  });

  return getSalesOpportunity(opportunity.id, businessId);
}

export async function logSalesActivity(
  businessId: string,
  staffId: string | null,
  input: {
    opportunityId?: string | null;
    leadId?: string | null;
    companyId?: string | null;
    contactId?: string | null;
    activityType: SalesActivityType;
    title: string;
    description?: string | null;
  },
): Promise<SalesActivityData> {
  const activity = await prisma.salesActivity.create({
    data: {
      businessId,
      opportunityId: input.opportunityId ?? null,
      leadId: input.leadId ?? null,
      companyId: input.companyId ?? null,
      contactId: input.contactId ?? null,
      staffId,
      activityType: input.activityType,
      title: input.title.trim(),
      description: input.description ?? null,
    },
  });

  return {
    id: activity.id,
    businessId: activity.businessId,
    opportunityId: activity.opportunityId,
    leadId: activity.leadId,
    companyId: activity.companyId,
    contactId: activity.contactId,
    staffId: activity.staffId,
    activityType: activity.activityType,
    title: activity.title,
    description: activity.description,
    createdAt: activity.createdAt,
  };
}

export async function getActivityTimeline(
  businessId: string,
  filters?: {
    opportunityId?: string;
    leadId?: string;
    companyId?: string;
    contactId?: string;
    limit?: number;
  },
): Promise<SalesActivityData[]> {
  const activities = await prisma.salesActivity.findMany({
    where: {
      businessId,
      opportunityId: filters?.opportunityId,
      leadId: filters?.leadId,
      companyId: filters?.companyId,
      contactId: filters?.contactId,
    },
    orderBy: { createdAt: "desc" },
    take: filters?.limit ?? 50,
  });

  return activities.map((activity) => ({
    id: activity.id,
    businessId: activity.businessId,
    opportunityId: activity.opportunityId,
    leadId: activity.leadId,
    companyId: activity.companyId,
    contactId: activity.contactId,
    staffId: activity.staffId,
    activityType: activity.activityType,
    title: activity.title,
    description: activity.description,
    createdAt: activity.createdAt,
  }));
}

export async function createSalesTask(
  businessId: string,
  staffId: string | null,
  input: {
    opportunityId?: string | null;
    leadId?: string | null;
    assignedStaffId?: string | null;
    title: string;
    description?: string | null;
    dueAt?: Date | null;
    priority?: SalesTaskPriority;
  },
): Promise<SalesTaskData> {
  const task = await prisma.salesTask.create({
    data: {
      businessId,
      opportunityId: input.opportunityId ?? null,
      leadId: input.leadId ?? null,
      assignedStaffId: input.assignedStaffId ?? null,
      title: input.title.trim(),
      description: input.description ?? null,
      dueAt: input.dueAt ?? null,
      priority: input.priority ?? "NORMAL",
    },
  });

  await logSalesAudit(businessId, {
    staffId,
    entityType: "task",
    entityId: task.id,
    action: "created",
  });

  return {
    id: task.id,
    businessId: task.businessId,
    opportunityId: task.opportunityId,
    leadId: task.leadId,
    assignedStaffId: task.assignedStaffId,
    title: task.title,
    description: task.description,
    dueAt: task.dueAt,
    status: task.status,
    priority: task.priority,
    completedAt: task.completedAt,
  };
}

export async function updateSalesTaskStatus(
  taskId: string,
  businessId: string,
  staffId: string | null,
  status: SalesTaskStatus,
): Promise<SalesTaskData> {
  const task = await prisma.salesTask.findFirst({
    where: { id: taskId, businessId },
  });
  if (!task) {
    throw new Error("Task not found");
  }

  const updated = await prisma.salesTask.update({
    where: { id: taskId },
    data: {
      status,
      completedAt: status === "COMPLETED" ? new Date() : null,
    },
  });

  await logSalesAudit(businessId, {
    staffId,
    entityType: "task",
    entityId: taskId,
    action: "status_updated",
    metadata: { status },
  });

  return {
    id: updated.id,
    businessId: updated.businessId,
    opportunityId: updated.opportunityId,
    leadId: updated.leadId,
    assignedStaffId: updated.assignedStaffId,
    title: updated.title,
    description: updated.description,
    dueAt: updated.dueAt,
    status: updated.status,
    priority: updated.priority,
    completedAt: updated.completedAt,
  };
}

export async function listSalesTasks(businessId: string): Promise<SalesTaskData[]> {
  const tasks = await prisma.salesTask.findMany({
    where: { businessId },
    orderBy: [{ status: "asc" }, { dueAt: "asc" }],
  });

  return tasks.map((task) => ({
    id: task.id,
    businessId: task.businessId,
    opportunityId: task.opportunityId,
    leadId: task.leadId,
    assignedStaffId: task.assignedStaffId,
    title: task.title,
    description: task.description,
    dueAt: task.dueAt,
    status: task.status,
    priority: task.priority,
    completedAt: task.completedAt,
  }));
}

export async function createSalesDemo(
  businessId: string,
  staffId: string | null,
  input: {
    opportunityId?: string | null;
    leadId?: string | null;
    scheduledAt: Date;
    durationMinutes?: number;
    status?: SalesDemoStatus;
    notes?: string | null;
  },
): Promise<SalesDemoData> {
  const demo = await prisma.salesDemo.create({
    data: {
      businessId,
      opportunityId: input.opportunityId ?? null,
      leadId: input.leadId ?? null,
      staffId,
      scheduledAt: input.scheduledAt,
      durationMinutes: input.durationMinutes ?? 60,
      status: input.status ?? "SCHEDULED",
      notes: input.notes ?? null,
    },
  });

  await logSalesActivity(businessId, staffId, {
    opportunityId: input.opportunityId,
    leadId: input.leadId,
    activityType: "DEMO",
    title: "Demo scheduled",
    description: input.notes ?? undefined,
  });

  await logSalesAudit(businessId, {
    staffId,
    entityType: "demo",
    entityId: demo.id,
    action: "created",
  });

  return {
    id: demo.id,
    businessId: demo.businessId,
    opportunityId: demo.opportunityId,
    leadId: demo.leadId,
    staffId: demo.staffId,
    scheduledAt: demo.scheduledAt,
    durationMinutes: demo.durationMinutes,
    status: demo.status,
    notes: demo.notes,
  };
}

export async function listSalesDemos(businessId: string): Promise<SalesDemoData[]> {
  const demos = await prisma.salesDemo.findMany({
    where: { businessId },
    orderBy: { scheduledAt: "asc" },
  });

  return demos.map((demo) => ({
    id: demo.id,
    businessId: demo.businessId,
    opportunityId: demo.opportunityId,
    leadId: demo.leadId,
    staffId: demo.staffId,
    scheduledAt: demo.scheduledAt,
    durationMinutes: demo.durationMinutes,
    status: demo.status,
    notes: demo.notes,
  }));
}

export async function getSalesDashboard(businessId: string): Promise<SalesDashboardData> {
  await ensureDefaultSalesPipeline(businessId);

  const [totalLeads, openLeads, opportunities, pendingTasks, upcomingDemos] = await Promise.all([
    prisma.salesLead.count({ where: { businessId, deletedAt: null } }),
    prisma.salesLead.count({
      where: {
        businessId,
        deletedAt: null,
        status: { notIn: ["CONVERTED", "UNQUALIFIED"] },
      },
    }),
    prisma.salesOpportunity.findMany({
      where: { businessId, deletedAt: null },
      include: { stage: true },
    }),
    prisma.salesTask.count({
      where: { businessId, status: { in: ["PENDING", "IN_PROGRESS"] } },
    }),
    prisma.salesDemo.count({
      where: {
        businessId,
        status: "SCHEDULED",
        scheduledAt: { gte: new Date() },
      },
    }),
  ]);

  const openOpportunities = opportunities.filter(
    (opportunity) => !opportunity.stage.isWon && !opportunity.stage.isLost,
  );
  const wonOpportunities = opportunities.filter((opportunity) => opportunity.stage.isWon);

  const stageMap = new Map<string, { stageName: string; count: number; valuePence: number }>();
  for (const opportunity of openOpportunities) {
    const existing = stageMap.get(opportunity.stageId) ?? {
      stageName: opportunity.stage.name,
      count: 0,
      valuePence: 0,
    };
    existing.count += 1;
    existing.valuePence += opportunity.valuePence;
    stageMap.set(opportunity.stageId, existing);
  }

  return {
    totalLeads,
    openLeads,
    totalOpportunities: opportunities.length,
    openOpportunityValuePence: openOpportunities.reduce(
      (sum, opportunity) => sum + opportunity.valuePence,
      0,
    ),
    wonOpportunityValuePence: wonOpportunities.reduce(
      (sum, opportunity) => sum + opportunity.valuePence,
      0,
    ),
    pendingTasks,
    upcomingDemos,
    stageBreakdown: Array.from(stageMap.entries()).map(([stageId, data]) => ({
      stageId,
      stageName: data.stageName,
      count: data.count,
      valuePence: data.valuePence,
    })),
  };
}

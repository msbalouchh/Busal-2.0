import "server-only";

import { prisma } from "@/lib/prisma";
import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { hasPermission } from "@/modules/authorization/services/authorization.service";
import type { BusinessContext } from "@/modules/business-context/types/business-context";
import { COMMERCIAL_LEADS_PAGE_SIZE } from "@/modules/commercial-platform/constants/commercial-platform";
import type {
  CommercialDashboardWidgets,
  CommercialPlatformBundle,
  CommercialPlatformPermissions,
  LeadDirectoryQuery,
  LeadDirectoryResult,
  UpdateCommercialLeadInput,
} from "@/modules/commercial-platform/types/commercial-platform-types";
import { getContractsDashboard } from "@/services/contracts.service";
import { getCrmDashboard } from "@/services/crm.service";
import { getCustomerSuccessDashboard } from "@/services/customer-success.service";
import { getImplementationDashboard } from "@/services/implementation-delivery.service";
import { getQuotesDashboard } from "@/services/quotes-proposals.service";
import { getRevopsDashboard } from "@/services/revops.service";
import {
  getActivityTimeline,
  getSalesDashboard,
  listSalesLeads,
  logSalesActivity,
  type SalesLeadData,
} from "@/services/sales-crm.service";

function buildPermissions(platform: BusinessContext): CommercialPlatformPermissions {
  const permissions = platform.authorization.permissions;

  return {
    canViewCrm: platform.isOwner || hasPermission(permissions, PERMISSION_CODES.CRM_VIEW),
    canManageCrm: platform.isOwner || hasPermission(permissions, PERMISSION_CODES.CRM_MANAGE),
    canViewLeads: platform.isOwner || hasPermission(permissions, PERMISSION_CODES.SALES_VIEW),
    canManageLeads:
      platform.isOwner ||
      hasPermission(permissions, PERMISSION_CODES.SALES_CREATE) ||
      hasPermission(permissions, PERMISSION_CODES.SALES_UPDATE) ||
      hasPermission(permissions, PERMISSION_CODES.SALES_MANAGE),
    canViewCustomers: platform.isOwner || hasPermission(permissions, PERMISSION_CODES.CRM_VIEW),
    canViewQuotes: platform.isOwner || hasPermission(permissions, PERMISSION_CODES.QUOTES_VIEW),
    canManageQuotes:
      platform.isOwner ||
      hasPermission(permissions, PERMISSION_CODES.QUOTES_CREATE) ||
      hasPermission(permissions, PERMISSION_CODES.QUOTES_EDIT) ||
      hasPermission(permissions, PERMISSION_CODES.QUOTES_SEND),
    canViewContracts:
      platform.isOwner || hasPermission(permissions, PERMISSION_CODES.CONTRACTS_VIEW),
    canManageContracts:
      platform.isOwner ||
      hasPermission(permissions, PERMISSION_CODES.CONTRACTS_CREATE) ||
      hasPermission(permissions, PERMISSION_CODES.CONTRACTS_EDIT),
    canViewProjects:
      platform.isOwner || hasPermission(permissions, PERMISSION_CODES.IMPLEMENTATION_VIEW),
    canManageProjects:
      platform.isOwner || hasPermission(permissions, PERMISSION_CODES.IMPLEMENTATION_MANAGE),
    canViewCustomerSuccess:
      platform.isOwner || hasPermission(permissions, PERMISSION_CODES.SUCCESS_VIEW),
    canManageCustomerSuccess:
      platform.isOwner || hasPermission(permissions, PERMISSION_CODES.SUCCESS_MANAGE),
    canViewRevenue: platform.isOwner || hasPermission(permissions, PERMISSION_CODES.REVENUE_VIEW),
    canManageRevenue:
      platform.isOwner || hasPermission(permissions, PERMISSION_CODES.REVENUE_MANAGE),
    canViewCatalogue:
      platform.isOwner || hasPermission(permissions, PERMISSION_CODES.COMMERCIAL_VIEW),
  };
}

async function calculateRecurringMetrics(
  businessId: string,
): Promise<{ mrrPence: number; arrPence: number }> {
  const activeContracts = await prisma.contract.findMany({
    where: { businessId, deletedAt: null, status: "ACTIVE" },
    include: { currentVersion: true },
  });

  const mrrPence = activeContracts.reduce((sum, contract) => {
    const total = contract.currentVersion?.totalPence ?? 0;
    return sum + Math.round(total / 12);
  }, 0);

  return {
    mrrPence,
    arrPence: mrrPence * 12,
  };
}

function buildWidgets(input: {
  crm: Awaited<ReturnType<typeof getCrmDashboard>> | null;
  sales: Awaited<ReturnType<typeof getSalesDashboard>> | null;
  quotes: Awaited<ReturnType<typeof getQuotesDashboard>> | null;
  contracts: Awaited<ReturnType<typeof getContractsDashboard>> | null;
  projects: Awaited<ReturnType<typeof getImplementationDashboard>> | null;
  customerSuccess: Awaited<ReturnType<typeof getCustomerSuccessDashboard>> | null;
  revenue: Awaited<ReturnType<typeof getRevopsDashboard>> | null;
  recurring: { mrrPence: number; arrPence: number };
}): CommercialDashboardWidgets {
  return {
    totalCustomers: input.crm?.totalCustomers ?? 0,
    openLeads: input.sales?.openLeads ?? 0,
    openOpportunityValuePence: input.sales?.openOpportunityValuePence ?? 0,
    sentQuotes: input.quotes?.sentQuotes ?? 0,
    activeContracts: input.contracts?.activeContracts ?? 0,
    inProgressProjects: input.projects?.inProgressProjects ?? 0,
    atRiskAccounts: input.customerSuccess?.atRiskAccounts ?? 0,
    outstandingRevenuePence: input.revenue?.outstandingPence ?? 0,
    mrrPence: input.recurring.mrrPence,
    arrPence: input.recurring.arrPence,
  };
}

export async function getCommercialPlatformBundle(
  platform: BusinessContext,
): Promise<CommercialPlatformBundle> {
  const permissions = buildPermissions(platform);
  const businessId = platform.business.id;

  const [
    sales,
    crm,
    quotes,
    contracts,
    projects,
    customerSuccess,
    revenue,
    recentActivities,
    recurring,
  ] = await Promise.all([
    permissions.canViewLeads ? getSalesDashboard(businessId) : Promise.resolve(null),
    permissions.canViewCustomers
      ? getCrmDashboard(businessId, platform.branchId)
      : Promise.resolve(null),
    permissions.canViewQuotes ? getQuotesDashboard(businessId) : Promise.resolve(null),
    permissions.canViewContracts ? getContractsDashboard(businessId) : Promise.resolve(null),
    permissions.canViewProjects ? getImplementationDashboard(businessId) : Promise.resolve(null),
    permissions.canViewCustomerSuccess
      ? getCustomerSuccessDashboard(businessId)
      : Promise.resolve(null),
    permissions.canViewRevenue ? getRevopsDashboard(businessId) : Promise.resolve(null),
    permissions.canViewLeads ? getActivityTimeline(businessId) : Promise.resolve([]),
    permissions.canViewRevenue
      ? calculateRecurringMetrics(businessId)
      : Promise.resolve({ mrrPence: 0, arrPence: 0 }),
  ]);

  return {
    permissions,
    widgets: buildWidgets({
      crm,
      sales,
      quotes,
      contracts,
      projects,
      customerSuccess,
      revenue,
      recurring,
    }),
    sales,
    crm: crm
      ? {
          totalCustomers: crm.totalCustomers,
          newCustomers: crm.newCustomers,
          returningCustomers: crm.returningCustomers,
          vipCustomers: crm.vipCustomers,
        }
      : null,
    quotes,
    contracts,
    projects,
    customerSuccess,
    revenue,
    recentActivities: recentActivities.slice(0, 8),
  };
}

export async function queryCommercialLeads(
  platform: BusinessContext,
  query: LeadDirectoryQuery = {},
): Promise<LeadDirectoryResult> {
  const page = Math.max(query.page ?? 1, 1);
  const pageSize = query.pageSize ?? COMMERCIAL_LEADS_PAGE_SIZE;
  const leads = await listSalesLeads(platform.business.id);

  const filtered = leads.filter((lead) => {
    const matchesSearch =
      !query.search?.trim() ||
      lead.title.toLowerCase().includes(query.search.trim().toLowerCase()) ||
      (lead.companyName ?? "").toLowerCase().includes(query.search.trim().toLowerCase()) ||
      (lead.notes ?? "").toLowerCase().includes(query.search.trim().toLowerCase());
    const matchesStatus = !query.status || lead.status === query.status;
    const matchesSource = !query.source || lead.source === query.source;
    const matchesOwner =
      query.assignedStaffId === undefined || lead.assignedStaffId === query.assignedStaffId;

    return matchesSearch && matchesStatus && matchesSource && matchesOwner;
  });

  const total = filtered.length;
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);
  const start = (page - 1) * pageSize;

  return {
    items: filtered.slice(start, start + pageSize),
    total,
    page,
    pageSize,
    totalPages,
  };
}

export async function updateCommercialLead(
  platform: BusinessContext,
  input: UpdateCommercialLeadInput,
): Promise<SalesLeadData> {
  const existing = await prisma.salesLead.findFirst({
    where: { id: input.leadId, businessId: platform.business.id, deletedAt: null },
    include: {
      company: { select: { name: true } },
      contact: { select: { firstName: true, lastName: true } },
    },
  });

  if (!existing) {
    throw new Error("Lead not found");
  }

  if (input.assignedStaffId) {
    const staff = await prisma.staff.findFirst({
      where: { id: input.assignedStaffId, businessId: platform.business.id },
    });
    if (!staff) {
      throw new Error("Assigned staff member not found");
    }
  }

  const lead = await prisma.salesLead.update({
    where: { id: input.leadId },
    data: {
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.assignedStaffId !== undefined ? { assignedStaffId: input.assignedStaffId } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
    },
    include: {
      company: { select: { name: true } },
      contact: { select: { firstName: true, lastName: true } },
    },
  });

  await logSalesActivity(platform.business.id, platform.staffSession?.staffId ?? null, {
    leadId: lead.id,
    activityType: "NOTE",
    title: "Lead updated",
    description: "Lead details updated from Commercial Platform",
  });

  return {
    id: lead.id,
    businessId: lead.businessId,
    companyId: lead.companyId,
    companyName: lead.company?.name ?? null,
    contactId: lead.contactId,
    contactName: lead.contact ? `${lead.contact.firstName} ${lead.contact.lastName}`.trim() : null,
    assignedStaffId: lead.assignedStaffId,
    title: lead.title,
    status: lead.status,
    source: lead.source,
    estimatedValuePence: lead.estimatedValuePence,
    notes: lead.notes,
    convertedOpportunityId: lead.convertedOpportunityId,
  };
}

export async function listCommercialLeadsForVerification(
  platform: BusinessContext,
): Promise<number> {
  const leads = await listSalesLeads(platform.business.id);
  return leads.length;
}

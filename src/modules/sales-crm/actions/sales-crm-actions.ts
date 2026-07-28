"use server";

import { revalidatePath } from "next/cache";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedAction } from "@/modules/platform-guards/guards/action.guards";
import { SALES_CRM_ROUTES } from "@/modules/sales-crm/constants/routes";
import type {
  OpportunityCatalogueLinkType,
  SalesLeadSource,
  SalesLeadStatus,
  SalesTaskPriority,
  SalesTaskStatus,
} from "@prisma/client";
import {
  convertLeadToOpportunity,
  createSalesCompany,
  createSalesContact,
  createSalesDemo,
  createSalesLead,
  createSalesOpportunity,
  createSalesTask,
  linkOpportunityCatalogueItem,
  logSalesActivity,
  moveOpportunityStage,
  updatePipelineStages,
  updateSalesTaskStatus,
} from "@/services/sales-crm.service";

function revalidateSalesPaths() {
  Object.values(SALES_CRM_ROUTES).forEach((path) => {
    revalidatePath(path);
  });
}

export async function createSalesCompanyAction(input: {
  name: string;
  website?: string | null;
  industry?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
}) {
  return protectedAction(PERMISSION_CODES.SALES_CREATE, async ({ business, platform }) => {
    const company = await createSalesCompany(
      business.id,
      platform.staffSession?.staffId ?? null,
      input,
    );
    revalidateSalesPaths();
    return { success: true as const, companyId: company.id };
  });
}

export async function createSalesContactAction(input: {
  companyId?: string | null;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  jobTitle?: string | null;
}) {
  return protectedAction(PERMISSION_CODES.SALES_CREATE, async ({ business, platform }) => {
    const contact = await createSalesContact(
      business.id,
      platform.staffSession?.staffId ?? null,
      input,
    );
    revalidateSalesPaths();
    return { success: true as const, contactId: contact.id };
  });
}

export async function createSalesLeadAction(input: {
  title: string;
  companyId?: string | null;
  contactId?: string | null;
  assignedStaffId?: string | null;
  status?: SalesLeadStatus;
  source?: SalesLeadSource;
  estimatedValuePence?: number;
  notes?: string | null;
}) {
  return protectedAction(PERMISSION_CODES.SALES_CREATE, async ({ business, platform }) => {
    const lead = await createSalesLead(business.id, platform.staffSession?.staffId ?? null, input);
    revalidateSalesPaths();
    return { success: true as const, leadId: lead.id };
  });
}

export async function createSalesOpportunityAction(input: {
  pipelineId?: string;
  stageId?: string;
  companyId?: string | null;
  contactId?: string | null;
  assignedStaffId?: string | null;
  name: string;
  description?: string | null;
  valuePence?: number;
  currency?: string;
  expectedCloseDate?: string | null;
  catalogueLinks?: Array<{
    linkType: OpportunityCatalogueLinkType;
    productVersionId?: string | null;
    bundleVersionId?: string | null;
  }>;
}) {
  return protectedAction(PERMISSION_CODES.SALES_CREATE, async ({ business, platform }) => {
    const opportunity = await createSalesOpportunity(
      business.id,
      platform.staffSession?.staffId ?? null,
      {
        ...input,
        expectedCloseDate: input.expectedCloseDate ? new Date(input.expectedCloseDate) : null,
      },
    );
    revalidateSalesPaths();
    return { success: true as const, opportunityId: opportunity.id };
  });
}

export async function moveOpportunityStageAction(opportunityId: string, stageId: string) {
  return protectedAction(PERMISSION_CODES.SALES_UPDATE, async ({ business, platform }) => {
    await moveOpportunityStage(
      opportunityId,
      business.id,
      platform.staffSession?.staffId ?? null,
      stageId,
    );
    revalidateSalesPaths();
    return { success: true as const };
  });
}

export async function convertLeadAction(
  leadId: string,
  input?: { name?: string; valuePence?: number },
) {
  return protectedAction(PERMISSION_CODES.SALES_UPDATE, async ({ business, platform }) => {
    const opportunity = await convertLeadToOpportunity(
      leadId,
      business.id,
      platform.staffSession?.staffId ?? null,
      input,
    );
    revalidateSalesPaths();
    return { success: true as const, opportunityId: opportunity.id };
  });
}

export async function linkCatalogueItemAction(
  opportunityId: string,
  link: {
    linkType: OpportunityCatalogueLinkType;
    productVersionId?: string | null;
    bundleVersionId?: string | null;
  },
) {
  return protectedAction(PERMISSION_CODES.SALES_UPDATE, async ({ business, platform }) => {
    await linkOpportunityCatalogueItem(
      opportunityId,
      business.id,
      platform.staffSession?.staffId ?? null,
      link,
    );
    revalidateSalesPaths();
    return { success: true as const };
  });
}

export async function logSalesActivityAction(input: {
  opportunityId?: string | null;
  leadId?: string | null;
  companyId?: string | null;
  contactId?: string | null;
  activityType: Parameters<typeof logSalesActivity>[2]["activityType"];
  title: string;
  description?: string | null;
}) {
  return protectedAction(PERMISSION_CODES.SALES_UPDATE, async ({ business, platform }) => {
    await logSalesActivity(business.id, platform.staffSession?.staffId ?? null, input);
    revalidateSalesPaths();
    return { success: true as const };
  });
}

export async function createSalesTaskAction(input: {
  opportunityId?: string | null;
  leadId?: string | null;
  assignedStaffId?: string | null;
  title: string;
  description?: string | null;
  dueAt?: string | null;
  priority?: SalesTaskPriority;
}) {
  return protectedAction(PERMISSION_CODES.SALES_CREATE, async ({ business, platform }) => {
    const task = await createSalesTask(business.id, platform.staffSession?.staffId ?? null, {
      ...input,
      dueAt: input.dueAt ? new Date(input.dueAt) : null,
    });
    revalidateSalesPaths();
    return { success: true as const, taskId: task.id };
  });
}

export async function updateSalesTaskStatusAction(taskId: string, status: SalesTaskStatus) {
  return protectedAction(PERMISSION_CODES.SALES_UPDATE, async ({ business, platform }) => {
    await updateSalesTaskStatus(
      taskId,
      business.id,
      platform.staffSession?.staffId ?? null,
      status,
    );
    revalidateSalesPaths();
    return { success: true as const };
  });
}

export async function createSalesDemoAction(input: {
  opportunityId?: string | null;
  leadId?: string | null;
  scheduledAt: string;
  durationMinutes?: number;
  notes?: string | null;
}) {
  return protectedAction(PERMISSION_CODES.SALES_CREATE, async ({ business, platform }) => {
    const demo = await createSalesDemo(business.id, platform.staffSession?.staffId ?? null, {
      ...input,
      scheduledAt: new Date(input.scheduledAt),
    });
    revalidateSalesPaths();
    return { success: true as const, demoId: demo.id };
  });
}

export async function updatePipelineStagesAction(
  pipelineId: string,
  stages: Array<{
    id?: string;
    name: string;
    slug?: string;
    sortOrder: number;
    probabilityBps?: number;
    isWon?: boolean;
    isLost?: boolean;
    isActive?: boolean;
  }>,
) {
  return protectedAction(PERMISSION_CODES.SALES_MANAGE, async ({ business, platform }) => {
    await updatePipelineStages(
      pipelineId,
      business.id,
      platform.staffSession?.staffId ?? null,
      stages,
    );
    revalidateSalesPaths();
    return { success: true as const };
  });
}

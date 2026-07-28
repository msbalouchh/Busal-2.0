import "server-only";

import type { CustomerHealthStatus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { logCustomerSuccessAudit } from "@/modules/customer-success/utils/customer-success-audit";
import { createSalesOpportunity } from "@/services/sales-crm.service";

const RENEWAL_TASK_DAYS_BEFORE = 90;

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function resolveHealthStatus(score: number): CustomerHealthStatus {
  if (score >= 80) {
    return "HEALTHY";
  }
  if (score >= 60) {
    return "STABLE";
  }
  if (score >= 40) {
    return "AT_RISK";
  }
  return "CRITICAL";
}

const DEFAULT_ACTIVATION_PLAYBOOK = {
  name: "Standard Activation",
  slug: "standard-activation",
  industry: "hospitality",
  trigger: "ACTIVATION" as const,
  description: "Default post-activation customer success playbook",
  steps: [
    {
      title: "Welcome call",
      taskType: "ONBOARDING" as const,
      sortOrder: 0,
      offsetDays: 0,
    },
    {
      title: "30-day check-in",
      taskType: "GENERAL" as const,
      sortOrder: 1,
      offsetDays: 30,
    },
    {
      title: "Schedule executive business review",
      taskType: "REVIEW" as const,
      sortOrder: 2,
      offsetDays: 60,
    },
  ],
};

export interface Customer360ProfileData {
  id: string;
  businessId: string;
  customerId: string;
  customerName: string;
  customerEmail: string | null;
  activationId: string;
  contractId: string;
  contractNumber: string | null;
  salesCompanyId: string | null;
  salesContactId: string | null;
  customerSuccessManagerId: string | null;
  healthScore: number;
  healthStatus: string;
  lastHealthCalculatedAt: Date | null;
  industry: string | null;
  implementationStatus: string | null;
  openTaskCount: number;
  openFeedbackCount: number;
  upcomingRenewalDate: Date | null;
  expansionCount: number;
  lastReviewAt: Date | null;
}

export interface CustomerSuccessDashboardData {
  totalAccounts: number;
  healthyAccounts: number;
  atRiskAccounts: number;
  criticalAccounts: number;
  openTasks: number;
  upcomingRenewals: number;
  openFeedback: number;
  expansionPipelinePence: number;
}

export interface SuccessPlaybookData {
  id: string;
  businessId: string;
  name: string;
  slug: string;
  industry: string | null;
  trigger: string;
  description: string | null;
  isActive: boolean;
  stepCount: number;
}

export interface CustomerSuccessTaskData {
  id: string;
  profileId: string;
  customerName: string;
  title: string;
  taskType: string;
  status: string;
  priority: string;
  dueAt: Date | null;
}

export interface CustomerFeedbackData {
  id: string;
  profileId: string;
  customerName: string;
  feedbackType: string;
  score: number | null;
  title: string;
  status: string;
}

export interface CustomerRenewalData {
  id: string;
  profileId: string;
  customerName: string;
  contractId: string;
  renewalDate: Date;
  status: string;
  taskGenerated: boolean;
}

export interface CustomerExpansionData {
  id: string;
  profileId: string;
  customerName: string;
  expansionType: string;
  title: string;
  estimatedValuePence: number;
  status: string;
  salesOpportunityId: string | null;
}

export interface ExecutiveReviewData {
  id: string;
  profileId: string;
  customerName: string;
  scheduledAt: Date;
  completedAt: Date | null;
  status: string;
  summary: string | null;
}

async function loadProfile(profileId: string, businessId: string): Promise<Customer360ProfileData> {
  const profile = await prisma.customerAccountProfile.findFirst({
    where: { id: profileId, businessId },
    include: {
      customer: true,
      contract: { select: { contractNumber: true, renewalDate: true } },
      activation: {
        include: {
          implementationProject: { select: { status: true } },
        },
      },
      renewals: {
        where: { status: { in: ["UPCOMING", "IN_PROGRESS", "AT_RISK"] } },
        orderBy: { renewalDate: "asc" },
        take: 1,
      },
      executiveReviews: {
        where: { status: "COMPLETED" },
        orderBy: { completedAt: "desc" },
        take: 1,
      },
      _count: {
        select: {
          tasks: { where: { status: { in: ["PENDING", "IN_PROGRESS"] } } },
          feedback: { where: { status: { in: ["OPEN", "ACKNOWLEDGED"] } } },
          expansions: true,
        },
      },
    },
  });

  if (!profile) {
    throw new Error("Customer profile not found");
  }

  return {
    id: profile.id,
    businessId: profile.businessId,
    customerId: profile.customerId,
    customerName: profile.customer.name,
    customerEmail: profile.customer.email,
    activationId: profile.activationId,
    contractId: profile.contractId,
    contractNumber: profile.contract.contractNumber,
    salesCompanyId: profile.salesCompanyId,
    salesContactId: profile.salesContactId,
    customerSuccessManagerId: profile.customerSuccessManagerId,
    healthScore: profile.healthScore,
    healthStatus: profile.healthStatus,
    lastHealthCalculatedAt: profile.lastHealthCalculatedAt,
    industry: profile.industry,
    implementationStatus: profile.activation.implementationProject?.status ?? null,
    openTaskCount: profile._count.tasks,
    openFeedbackCount: profile._count.feedback,
    upcomingRenewalDate: profile.renewals[0]?.renewalDate ?? profile.contract.renewalDate,
    expansionCount: profile._count.expansions,
    lastReviewAt: profile.executiveReviews[0]?.completedAt ?? null,
  };
}

export async function ensureDefaultSuccessPlaybooks(businessId: string): Promise<void> {
  const existing = await prisma.successPlaybook.findFirst({
    where: { businessId, slug: DEFAULT_ACTIVATION_PLAYBOOK.slug },
  });

  if (!existing) {
    await prisma.successPlaybook.create({
      data: {
        businessId,
        name: DEFAULT_ACTIVATION_PLAYBOOK.name,
        slug: DEFAULT_ACTIVATION_PLAYBOOK.slug,
        industry: DEFAULT_ACTIVATION_PLAYBOOK.industry,
        trigger: DEFAULT_ACTIVATION_PLAYBOOK.trigger,
        description: DEFAULT_ACTIVATION_PLAYBOOK.description,
        steps: {
          create: DEFAULT_ACTIVATION_PLAYBOOK.steps.map((step) => ({
            title: step.title,
            taskType: step.taskType,
            sortOrder: step.sortOrder,
            offsetDays: step.offsetDays,
          })),
        },
      },
    });
  }
}

async function applyPlaybookToProfile(
  profileId: string,
  playbookId: string,
  startDate: Date,
  tx: Prisma.TransactionClient,
): Promise<void> {
  const playbook = await tx.successPlaybook.findFirst({
    where: { id: playbookId },
    include: { steps: { orderBy: { sortOrder: "asc" } } },
  });

  if (!playbook) {
    return;
  }

  for (const step of playbook.steps) {
    const dueAt = new Date(startDate);
    dueAt.setDate(dueAt.getDate() + step.offsetDays);

    await tx.customerSuccessTask.create({
      data: {
        profileId,
        playbookStepId: step.id,
        title: step.title,
        description: step.description,
        taskType: step.taskType,
        dueAt,
      },
    });
  }
}

async function generateRenewalRecordForProfile(
  profileId: string,
  contractId: string,
  renewalDate: Date,
  tx: Prisma.TransactionClient,
): Promise<void> {
  const existing = await tx.customerRenewalRecord.findFirst({
    where: { profileId, contractId, status: { in: ["UPCOMING", "IN_PROGRESS", "AT_RISK"] } },
  });

  if (existing) {
    return;
  }

  const renewal = await tx.customerRenewalRecord.create({
    data: {
      profileId,
      contractId,
      renewalDate,
      status: "UPCOMING",
    },
  });

  const taskDueAt = new Date(renewalDate);
  taskDueAt.setDate(taskDueAt.getDate() - RENEWAL_TASK_DAYS_BEFORE);

  await tx.customerSuccessTask.create({
    data: {
      profileId,
      title: "Prepare contract renewal",
      description: "Review account health and initiate renewal discussions",
      taskType: "RENEWAL",
      priority: "HIGH",
      dueAt: taskDueAt,
    },
  });

  await tx.customerRenewalRecord.update({
    where: { id: renewal.id },
    data: { taskGenerated: true },
  });
}

export async function calculateCustomerHealthScore(
  profileId: string,
  businessId: string,
  staffId: string | null = null,
): Promise<Customer360ProfileData> {
  const profile = await prisma.customerAccountProfile.findFirst({
    where: { id: profileId, businessId },
    include: {
      customer: true,
      contract: true,
      activation: {
        include: {
          implementationProject: {
            include: {
              issues: { where: { status: { in: ["OPEN", "IN_PROGRESS"] } } },
              risks: { where: { status: "OPEN" } },
            },
          },
        },
      },
      feedback: { orderBy: { createdAt: "desc" }, take: 10 },
      renewals: {
        where: { status: { in: ["UPCOMING", "AT_RISK"] } },
        orderBy: { renewalDate: "asc" },
        take: 1,
      },
    },
  });

  if (!profile) {
    throw new Error("Customer profile not found");
  }

  let score = 75;
  const factors: Record<string, number | string> = { base: 75 };

  const implementation = profile.activation.implementationProject;
  if (implementation) {
    if (implementation.status === "HYPERCARE") {
      score += 5;
      factors.implementation = "hypercare";
    } else if (implementation.status === "CLOSED" || implementation.status === "COMPLETED") {
      score += 10;
      factors.implementation = "completed";
    } else if (implementation.status === "ON_HOLD") {
      score -= 15;
      factors.implementation = "on_hold";
    }

    score -= implementation.issues.length * 5;
    score -= implementation.risks.length * 3;
    factors.openIssues = implementation.issues.length;
    factors.openRisks = implementation.risks.length;
  }

  const npsScores = profile.feedback.filter(
    (item) => item.feedbackType === "NPS" && item.score != null,
  );
  if (npsScores.length > 0) {
    const avgNps = npsScores.reduce((sum, item) => sum + (item.score ?? 0), 0) / npsScores.length;
    score += Math.round((avgNps - 7) * 3);
    factors.avgNps = avgNps;
  }

  const csatScores = profile.feedback.filter(
    (item) => item.feedbackType === "CSAT" && item.score != null,
  );
  if (csatScores.length > 0) {
    const avgCsat =
      csatScores.reduce((sum, item) => sum + (item.score ?? 0), 0) / csatScores.length;
    score += Math.round((avgCsat - 3) * 5);
    factors.avgCsat = avgCsat;
  }

  const complaints = profile.feedback.filter((item) => item.feedbackType === "COMPLAINT").length;
  score -= complaints * 8;
  factors.complaints = complaints;

  const renewalDate = profile.renewals[0]?.renewalDate ?? profile.contract.renewalDate;
  if (renewalDate) {
    const daysUntilRenewal = Math.ceil((renewalDate.getTime() - Date.now()) / 86400000);
    if (daysUntilRenewal <= 30) {
      score -= 10;
      factors.renewalProximity = "within_30_days";
    } else if (daysUntilRenewal <= 90) {
      score -= 5;
      factors.renewalProximity = "within_90_days";
    }
  }

  score = Math.max(0, Math.min(100, score));
  const status = resolveHealthStatus(score);
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.customerAccountProfile.update({
      where: { id: profileId },
      data: { healthScore: score, healthStatus: status, lastHealthCalculatedAt: now },
    });

    await tx.customerHealthScore.create({
      data: { profileId, score, status, factors },
    });

    await logCustomerSuccessAudit(
      businessId,
      {
        staffId,
        entityType: "customer_account_profile",
        entityId: profileId,
        action: "health_calculated",
        metadata: { score, status },
      },
      tx,
    );
  });

  return loadProfile(profileId, businessId);
}

export async function provisionCustomerAccountProfile(
  input: {
    businessId: string;
    customerId: string;
    activationId: string;
    contractId: string;
    customerSuccessManagerId?: string | null;
    salesCompanyId?: string | null;
    salesContactId?: string | null;
    industry?: string | null;
    contractRenewalDate?: Date | null;
  },
  staffId: string | null,
  tx: Prisma.TransactionClient = prisma,
): Promise<string> {
  await ensureDefaultSuccessPlaybooks(input.businessId);

  const existing = await tx.customerAccountProfile.findUnique({
    where: { activationId: input.activationId },
  });
  if (existing) {
    return existing.id;
  }

  const playbook = await tx.successPlaybook.findFirst({
    where: {
      businessId: input.businessId,
      trigger: "ACTIVATION",
      isActive: true,
      ...(input.industry ? { industry: input.industry } : {}),
    },
    orderBy: { createdAt: "asc" },
  });

  const startedAt = new Date();

  const profile = await tx.customerAccountProfile.create({
    data: {
      businessId: input.businessId,
      customerId: input.customerId,
      activationId: input.activationId,
      contractId: input.contractId,
      salesCompanyId: input.salesCompanyId ?? null,
      salesContactId: input.salesContactId ?? null,
      customerSuccessManagerId: input.customerSuccessManagerId ?? null,
      industry: input.industry ?? null,
    },
  });

  if (playbook) {
    await applyPlaybookToProfile(profile.id, playbook.id, startedAt, tx);
  }

  if (input.contractRenewalDate) {
    await generateRenewalRecordForProfile(
      profile.id,
      input.contractId,
      input.contractRenewalDate,
      tx,
    );
  }

  await logCustomerSuccessAudit(
    input.businessId,
    {
      staffId,
      entityType: "customer_account_profile",
      entityId: profile.id,
      action: "provisioned",
      metadata: { activationId: input.activationId },
    },
    tx,
  );

  return profile.id;
}

export async function listCustomer360Profiles(
  businessId: string,
): Promise<Customer360ProfileData[]> {
  const profiles = await prisma.customerAccountProfile.findMany({
    where: { businessId },
    orderBy: { updatedAt: "desc" },
  });

  return Promise.all(profiles.map((profile) => loadProfile(profile.id, businessId)));
}

export async function getCustomer360Profile(
  profileId: string,
  businessId: string,
): Promise<Customer360ProfileData> {
  return loadProfile(profileId, businessId);
}

export async function listSuccessPlaybooks(businessId: string): Promise<SuccessPlaybookData[]> {
  await ensureDefaultSuccessPlaybooks(businessId);

  const playbooks = await prisma.successPlaybook.findMany({
    where: { businessId, isActive: true },
    include: { _count: { select: { steps: true } } },
    orderBy: { name: "asc" },
  });

  return playbooks.map((playbook) => ({
    id: playbook.id,
    businessId: playbook.businessId,
    name: playbook.name,
    slug: playbook.slug,
    industry: playbook.industry,
    trigger: playbook.trigger,
    description: playbook.description,
    isActive: playbook.isActive,
    stepCount: playbook._count.steps,
  }));
}

export async function createSuccessPlaybook(
  businessId: string,
  staffId: string | null,
  input: {
    name: string;
    industry?: string | null;
    trigger?: "ACTIVATION" | "GO_LIVE" | "RENEWAL_DUE" | "HEALTH_AT_RISK" | "MANUAL";
    description?: string | null;
    steps: Array<{
      title: string;
      description?: string | null;
      taskType?: "GENERAL" | "RENEWAL" | "ONBOARDING" | "REVIEW" | "EXPANSION" | "FEEDBACK";
      sortOrder: number;
      offsetDays?: number;
    }>;
  },
): Promise<SuccessPlaybookData> {
  const playbook = await prisma.successPlaybook.create({
    data: {
      businessId,
      name: input.name.trim(),
      slug: slugify(input.name),
      industry: input.industry ?? null,
      trigger: input.trigger ?? "MANUAL",
      description: input.description ?? null,
      steps: {
        create: input.steps.map((step) => ({
          title: step.title,
          description: step.description ?? null,
          taskType: step.taskType ?? "GENERAL",
          sortOrder: step.sortOrder,
          offsetDays: step.offsetDays ?? 0,
        })),
      },
    },
    include: { _count: { select: { steps: true } } },
  });

  await logCustomerSuccessAudit(businessId, {
    staffId,
    entityType: "success_playbook",
    entityId: playbook.id,
    action: "created",
  });

  return {
    id: playbook.id,
    businessId: playbook.businessId,
    name: playbook.name,
    slug: playbook.slug,
    industry: playbook.industry,
    trigger: playbook.trigger,
    description: playbook.description,
    isActive: playbook.isActive,
    stepCount: playbook._count.steps,
  };
}

export async function listCustomerSuccessTasks(
  businessId: string,
): Promise<CustomerSuccessTaskData[]> {
  const tasks = await prisma.customerSuccessTask.findMany({
    where: { profile: { businessId } },
    include: { profile: { include: { customer: true } } },
    orderBy: [{ dueAt: "asc" }, { createdAt: "asc" }],
  });

  return tasks.map((task) => ({
    id: task.id,
    profileId: task.profileId,
    customerName: task.profile.customer.name,
    title: task.title,
    taskType: task.taskType,
    status: task.status,
    priority: task.priority,
    dueAt: task.dueAt,
  }));
}

export async function completeCustomerSuccessTask(
  taskId: string,
  businessId: string,
  staffId: string | null,
): Promise<void> {
  const task = await prisma.customerSuccessTask.findFirst({
    where: { id: taskId, profile: { businessId } },
  });
  if (!task) {
    throw new Error("Task not found");
  }

  await prisma.customerSuccessTask.update({
    where: { id: taskId },
    data: { status: "COMPLETED", completedAt: new Date() },
  });

  await logCustomerSuccessAudit(businessId, {
    staffId,
    entityType: "customer_success_task",
    entityId: taskId,
    action: "completed",
  });
}

export async function assignCustomerSuccessTask(
  taskId: string,
  businessId: string,
  staffId: string | null,
  assignedStaffId: string | null,
): Promise<void> {
  const task = await prisma.customerSuccessTask.findFirst({
    where: { id: taskId, profile: { businessId } },
  });
  if (!task) {
    throw new Error("Task not found");
  }

  await prisma.customerSuccessTask.update({
    where: { id: taskId },
    data: { assignedStaffId },
  });

  await logCustomerSuccessAudit(businessId, {
    staffId,
    entityType: "customer_success_task",
    entityId: taskId,
    action: "assigned",
    metadata: { assignedStaffId },
  });
}

export async function recordCustomerFeedback(
  profileId: string,
  businessId: string,
  staffId: string | null,
  input: {
    feedbackType: "CSAT" | "NPS" | "FEATURE_REQUEST" | "COMPLAINT";
    score?: number | null;
    title: string;
    content?: string | null;
    submittedByName?: string | null;
    submittedByEmail?: string | null;
  },
): Promise<void> {
  const profile = await prisma.customerAccountProfile.findFirst({
    where: { id: profileId, businessId },
  });
  if (!profile) {
    throw new Error("Customer profile not found");
  }

  await prisma.customerFeedback.create({
    data: {
      profileId,
      feedbackType: input.feedbackType,
      score: input.score ?? null,
      title: input.title.trim(),
      content: input.content ?? null,
      submittedByName: input.submittedByName ?? null,
      submittedByEmail: input.submittedByEmail ?? null,
    },
  });

  await calculateCustomerHealthScore(profileId, businessId, staffId);
}

export async function listCustomerFeedback(businessId: string): Promise<CustomerFeedbackData[]> {
  const feedback = await prisma.customerFeedback.findMany({
    where: { profile: { businessId } },
    include: { profile: { include: { customer: true } } },
    orderBy: { createdAt: "desc" },
  });

  return feedback.map((item) => ({
    id: item.id,
    profileId: item.profileId,
    customerName: item.profile.customer.name,
    feedbackType: item.feedbackType,
    score: item.score,
    title: item.title,
    status: item.status,
  }));
}

export async function listCustomerRenewals(businessId: string): Promise<CustomerRenewalData[]> {
  const renewals = await prisma.customerRenewalRecord.findMany({
    where: { profile: { businessId } },
    include: { profile: { include: { customer: true } } },
    orderBy: { renewalDate: "asc" },
  });

  return renewals.map((renewal) => ({
    id: renewal.id,
    profileId: renewal.profileId,
    customerName: renewal.profile.customer.name,
    contractId: renewal.contractId,
    renewalDate: renewal.renewalDate,
    status: renewal.status,
    taskGenerated: renewal.taskGenerated,
  }));
}

export async function scheduleCustomerRenewal(
  profileId: string,
  businessId: string,
  staffId: string | null,
  input: { renewalDate: Date; notes?: string | null; contractRenewalId?: string | null },
): Promise<void> {
  const profile = await prisma.customerAccountProfile.findFirst({
    where: { id: profileId, businessId },
  });
  if (!profile) {
    throw new Error("Customer profile not found");
  }

  await prisma.$transaction(async (tx) => {
    await generateRenewalRecordForProfile(profileId, profile.contractId, input.renewalDate, tx);

    const renewal = await tx.customerRenewalRecord.findFirst({
      where: { profileId, contractId: profile.contractId, renewalDate: input.renewalDate },
    });

    if (renewal && input.notes) {
      await tx.customerRenewalRecord.update({
        where: { id: renewal.id },
        data: {
          notes: input.notes,
          contractRenewalId: input.contractRenewalId ?? null,
        },
      });
    }

    await logCustomerSuccessAudit(
      businessId,
      {
        staffId,
        entityType: "customer_renewal",
        entityId: profileId,
        action: "scheduled",
        metadata: { renewalDate: input.renewalDate.toISOString() },
      },
      tx,
    );
  });
}

export async function createExpansionOpportunity(
  profileId: string,
  businessId: string,
  staffId: string | null,
  input: {
    expansionType: "UPSELL" | "CROSS_SELL";
    title: string;
    description?: string | null;
    estimatedValuePence?: number;
    createSalesOpportunity?: boolean;
    catalogueLinks?: Array<{
      linkType: "PRODUCT" | "BUNDLE" | "IMPLEMENTATION_PACKAGE" | "MANAGED_SERVICE";
      productVersionId?: string | null;
      bundleVersionId?: string | null;
    }>;
  },
): Promise<{ expansionId: string; salesOpportunityId: string | null }> {
  const profile = await prisma.customerAccountProfile.findFirst({
    where: { id: profileId, businessId },
  });
  if (!profile) {
    throw new Error("Customer profile not found");
  }

  let salesOpportunityId: string | null = null;

  if (input.createSalesOpportunity !== false) {
    const opportunity = await createSalesOpportunity(businessId, staffId, {
      companyId: profile.salesCompanyId,
      contactId: profile.salesContactId,
      assignedStaffId: profile.customerSuccessManagerId,
      name: input.title.trim(),
      description: input.description ?? null,
      valuePence: input.estimatedValuePence ?? 0,
      catalogueLinks: input.catalogueLinks,
    });
    salesOpportunityId = opportunity.id;
  }

  const expansion = await prisma.customerExpansionOpportunity.create({
    data: {
      profileId,
      salesOpportunityId,
      expansionType: input.expansionType,
      title: input.title.trim(),
      description: input.description ?? null,
      estimatedValuePence: input.estimatedValuePence ?? 0,
      status: salesOpportunityId ? "OPPORTUNITY_CREATED" : "IDENTIFIED",
    },
  });

  await logCustomerSuccessAudit(businessId, {
    staffId,
    entityType: "customer_expansion",
    entityId: expansion.id,
    action: "created",
    metadata: { salesOpportunityId },
  });

  return { expansionId: expansion.id, salesOpportunityId };
}

export async function listExpansionOpportunities(
  businessId: string,
): Promise<CustomerExpansionData[]> {
  const expansions = await prisma.customerExpansionOpportunity.findMany({
    where: { profile: { businessId } },
    include: { profile: { include: { customer: true } } },
    orderBy: { createdAt: "desc" },
  });

  return expansions.map((expansion) => ({
    id: expansion.id,
    profileId: expansion.profileId,
    customerName: expansion.profile.customer.name,
    expansionType: expansion.expansionType,
    title: expansion.title,
    estimatedValuePence: expansion.estimatedValuePence,
    status: expansion.status,
    salesOpportunityId: expansion.salesOpportunityId,
  }));
}

export async function scheduleExecutiveReview(
  profileId: string,
  businessId: string,
  staffId: string | null,
  input: { scheduledAt: Date; attendees?: string | null },
): Promise<void> {
  const profile = await prisma.customerAccountProfile.findFirst({
    where: { id: profileId, businessId },
  });
  if (!profile) {
    throw new Error("Customer profile not found");
  }

  await prisma.executiveBusinessReview.create({
    data: {
      profileId,
      scheduledAt: input.scheduledAt,
      attendees: input.attendees ?? null,
      conductedByStaffId: staffId,
    },
  });

  await logCustomerSuccessAudit(businessId, {
    staffId,
    entityType: "executive_review",
    entityId: profileId,
    action: "scheduled",
  });
}

export async function completeExecutiveReview(
  reviewId: string,
  businessId: string,
  staffId: string | null,
  input: { summary: string; nextReviewAt?: Date | null },
): Promise<void> {
  const review = await prisma.executiveBusinessReview.findFirst({
    where: { id: reviewId, profile: { businessId } },
  });
  if (!review) {
    throw new Error("Executive review not found");
  }

  await prisma.executiveBusinessReview.update({
    where: { id: reviewId },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
      summary: input.summary,
      nextReviewAt: input.nextReviewAt ?? null,
      conductedByStaffId: staffId,
    },
  });

  await logCustomerSuccessAudit(businessId, {
    staffId,
    entityType: "executive_review",
    entityId: reviewId,
    action: "completed",
  });
}

export async function listExecutiveReviews(businessId: string): Promise<ExecutiveReviewData[]> {
  const reviews = await prisma.executiveBusinessReview.findMany({
    where: { profile: { businessId } },
    include: { profile: { include: { customer: true } } },
    orderBy: { scheduledAt: "desc" },
  });

  return reviews.map((review) => ({
    id: review.id,
    profileId: review.profileId,
    customerName: review.profile.customer.name,
    scheduledAt: review.scheduledAt,
    completedAt: review.completedAt,
    status: review.status,
    summary: review.summary,
  }));
}

export async function getCustomerSuccessDashboard(
  businessId: string,
): Promise<CustomerSuccessDashboardData> {
  const [profiles, openTasks, upcomingRenewals, openFeedback, expansions] = await Promise.all([
    prisma.customerAccountProfile.findMany({ where: { businessId } }),
    prisma.customerSuccessTask.count({
      where: { profile: { businessId }, status: { in: ["PENDING", "IN_PROGRESS"] } },
    }),
    prisma.customerRenewalRecord.count({
      where: {
        profile: { businessId },
        status: { in: ["UPCOMING", "IN_PROGRESS", "AT_RISK"] },
        renewalDate: { lte: new Date(Date.now() + 90 * 86400000) },
      },
    }),
    prisma.customerFeedback.count({
      where: { profile: { businessId }, status: { in: ["OPEN", "ACKNOWLEDGED"] } },
    }),
    prisma.customerExpansionOpportunity.findMany({
      where: {
        profile: { businessId },
        status: { in: ["IDENTIFIED", "QUALIFIED", "OPPORTUNITY_CREATED"] },
      },
    }),
  ]);

  return {
    totalAccounts: profiles.length,
    healthyAccounts: profiles.filter((profile) => profile.healthStatus === "HEALTHY").length,
    atRiskAccounts: profiles.filter((profile) => profile.healthStatus === "AT_RISK").length,
    criticalAccounts: profiles.filter((profile) => profile.healthStatus === "CRITICAL").length,
    openTasks,
    upcomingRenewals,
    openFeedback,
    expansionPipelinePence: expansions.reduce(
      (sum, expansion) => sum + expansion.estimatedValuePence,
      0,
    ),
  };
}

export const CUSTOMER_SUCCESS_RENEWAL_TASK_DAYS = RENEWAL_TASK_DAYS_BEFORE;

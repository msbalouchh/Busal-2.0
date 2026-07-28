import "server-only";

import { randomUUID } from "node:crypto";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { logImplementationAudit } from "@/modules/implementation/utils/implementation-audit";

const HYPERCARE_DAYS = 30;

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const DEFAULT_HOSPITALITY_TEMPLATE = {
  name: "Hospitality Standard",
  slug: "hospitality-standard",
  industry: "hospitality",
  description: "Standard restaurant and hospitality onboarding",
  milestones: [
    {
      name: "Discovery & Planning",
      description: "Requirements and project kickoff",
      sortOrder: 0,
      offsetDays: 0,
      tasks: [
        { title: "Kickoff call", isMandatoryForGoLive: true, visibleToCustomer: true },
        { title: "Collect venue details", isMandatoryForGoLive: true, visibleToCustomer: true },
      ],
    },
    {
      name: "Configuration",
      description: "System setup and menu configuration",
      sortOrder: 1,
      offsetDays: 7,
      tasks: [
        {
          title: "Configure menu and categories",
          isMandatoryForGoLive: true,
          visibleToCustomer: true,
        },
        {
          title: "Configure POS and payments",
          isMandatoryForGoLive: true,
          visibleToCustomer: false,
        },
      ],
    },
    {
      name: "Training",
      description: "Staff training and UAT",
      sortOrder: 2,
      offsetDays: 14,
      tasks: [
        { title: "Staff training session", isMandatoryForGoLive: true, visibleToCustomer: true },
        { title: "UAT sign-off", isMandatoryForGoLive: true, visibleToCustomer: true },
      ],
    },
    {
      name: "Go-Live",
      description: "Production launch",
      sortOrder: 3,
      offsetDays: 21,
      tasks: [
        { title: "Go-live readiness review", isMandatoryForGoLive: true, visibleToCustomer: true },
      ],
    },
  ],
} as const;

export interface ProjectTemplateData {
  id: string;
  businessId: string;
  name: string;
  slug: string;
  industry: string;
  description: string | null;
  isActive: boolean;
  milestoneCount: number;
}

export interface ImplementationProjectData {
  id: string;
  businessId: string;
  contractId: string;
  customerId: string;
  customerName: string;
  templateId: string | null;
  name: string;
  industry: string | null;
  status: string;
  assignedStaffId: string | null;
  portalToken: string | null;
  startedAt: Date | null;
  goLiveAt: Date | null;
  milestoneCount: number;
  taskCount: number;
  openRiskCount: number;
  openIssueCount: number;
  pendingChangeRequests: number;
  goLiveChecklistComplete: boolean;
  hypercareActive: boolean;
}

export interface ImplementationDashboardData {
  totalProjects: number;
  inProgressProjects: number;
  hypercareProjects: number;
  completedProjects: number;
  openRisks: number;
  openIssues: number;
}

async function loadProject(
  projectId: string,
  businessId: string,
): Promise<ImplementationProjectData> {
  const project = await prisma.implementationProject.findFirst({
    where: { id: projectId, businessId },
    include: {
      customer: true,
      hypercare: true,
      goLiveChecklist: true,
      _count: {
        select: {
          milestones: true,
          tasks: true,
          risks: true,
          issues: true,
          changeRequests: true,
        },
      },
      risks: { where: { status: "OPEN" } },
      issues: { where: { status: { in: ["OPEN", "IN_PROGRESS"] } } },
      changeRequests: { where: { status: "SUBMITTED" } },
    },
  });

  if (!project) {
    throw new Error("Implementation project not found");
  }

  const mandatoryIncomplete = project.goLiveChecklist.filter(
    (item) => item.isMandatory && item.status !== "COMPLETED",
  );

  return {
    id: project.id,
    businessId: project.businessId,
    contractId: project.contractId,
    customerId: project.customerId,
    customerName: project.customer.name,
    templateId: project.templateId,
    name: project.name,
    industry: project.industry,
    status: project.status,
    assignedStaffId: project.assignedStaffId,
    portalToken: project.portalToken,
    startedAt: project.startedAt,
    goLiveAt: project.goLiveAt,
    milestoneCount: project._count.milestones,
    taskCount: project._count.tasks,
    openRiskCount: project.risks.length,
    openIssueCount: project.issues.length,
    pendingChangeRequests: project.changeRequests.length,
    goLiveChecklistComplete: mandatoryIncomplete.length === 0,
    hypercareActive: project.hypercare?.status === "ACTIVE",
  };
}

export async function ensureDefaultProjectTemplates(businessId: string): Promise<void> {
  const existing = await prisma.projectTemplate.findFirst({
    where: { businessId, slug: DEFAULT_HOSPITALITY_TEMPLATE.slug },
  });

  if (!existing) {
    await prisma.projectTemplate.create({
      data: {
        businessId,
        name: DEFAULT_HOSPITALITY_TEMPLATE.name,
        slug: DEFAULT_HOSPITALITY_TEMPLATE.slug,
        industry: DEFAULT_HOSPITALITY_TEMPLATE.industry,
        description: DEFAULT_HOSPITALITY_TEMPLATE.description,
        milestones: {
          create: DEFAULT_HOSPITALITY_TEMPLATE.milestones.map((milestone) => ({
            name: milestone.name,
            description: milestone.description,
            sortOrder: milestone.sortOrder,
            offsetDays: milestone.offsetDays,
            tasks: {
              create: milestone.tasks.map((task, index) => ({
                title: task.title,
                sortOrder: index,
                isMandatoryForGoLive: task.isMandatoryForGoLive,
                visibleToCustomer: task.visibleToCustomer,
              })),
            },
          })),
        },
      },
    });
  }
}

export async function listProjectTemplates(businessId: string): Promise<ProjectTemplateData[]> {
  await ensureDefaultProjectTemplates(businessId);

  const templates = await prisma.projectTemplate.findMany({
    where: { businessId, isActive: true },
    include: { _count: { select: { milestones: true } } },
    orderBy: [{ industry: "asc" }, { name: "asc" }],
  });

  return templates.map((template) => ({
    id: template.id,
    businessId: template.businessId,
    name: template.name,
    slug: template.slug,
    industry: template.industry,
    description: template.description,
    isActive: template.isActive,
    milestoneCount: template._count.milestones,
  }));
}

export async function createProjectTemplate(
  businessId: string,
  staffId: string | null,
  input: {
    name: string;
    industry: string;
    description?: string | null;
    milestones: Array<{
      name: string;
      description?: string | null;
      sortOrder: number;
      offsetDays?: number;
      tasks: Array<{
        title: string;
        description?: string | null;
        isMandatoryForGoLive?: boolean;
        visibleToCustomer?: boolean;
        sortOrder?: number;
      }>;
    }>;
  },
): Promise<ProjectTemplateData> {
  const template = await prisma.projectTemplate.create({
    data: {
      businessId,
      name: input.name.trim(),
      slug: slugify(input.name),
      industry: input.industry.trim(),
      description: input.description ?? null,
      milestones: {
        create: input.milestones.map((milestone) => ({
          name: milestone.name,
          description: milestone.description ?? null,
          sortOrder: milestone.sortOrder,
          offsetDays: milestone.offsetDays ?? 0,
          tasks: {
            create: milestone.tasks.map((task, index) => ({
              title: task.title,
              description: task.description ?? null,
              sortOrder: task.sortOrder ?? index,
              isMandatoryForGoLive: task.isMandatoryForGoLive ?? false,
              visibleToCustomer: task.visibleToCustomer ?? true,
            })),
          },
        })),
      },
    },
    include: { _count: { select: { milestones: true } } },
  });

  await logImplementationAudit(businessId, {
    staffId,
    entityType: "project_template",
    entityId: template.id,
    action: "created",
  });

  return {
    id: template.id,
    businessId: template.businessId,
    name: template.name,
    slug: template.slug,
    industry: template.industry,
    description: template.description,
    isActive: template.isActive,
    milestoneCount: template._count.milestones,
  };
}

async function applyTemplateToProject(
  projectId: string,
  templateId: string,
  startedAt: Date,
  tx: Prisma.TransactionClient,
): Promise<void> {
  const template = await tx.projectTemplate.findFirst({
    where: { id: templateId },
    include: {
      milestones: {
        orderBy: { sortOrder: "asc" },
        include: { tasks: { orderBy: { sortOrder: "asc" } } },
      },
    },
  });

  if (!template) {
    return;
  }

  for (const milestone of template.milestones) {
    const dueAt = new Date(startedAt);
    dueAt.setDate(dueAt.getDate() + milestone.offsetDays);

    const createdMilestone = await tx.implementationMilestone.create({
      data: {
        projectId,
        name: milestone.name,
        description: milestone.description,
        sortOrder: milestone.sortOrder,
        dueAt,
      },
    });

    for (const task of milestone.tasks) {
      await tx.implementationTask.create({
        data: {
          projectId,
          milestoneId: createdMilestone.id,
          title: task.title,
          description: task.description,
          isMandatoryForGoLive: task.isMandatoryForGoLive,
          visibleToCustomer: task.visibleToCustomer,
          dueAt,
        },
      });

      if (task.isMandatoryForGoLive) {
        await tx.goLiveChecklistItem.create({
          data: {
            projectId,
            title: task.title,
            description: task.description,
            isMandatory: true,
            sortOrder: task.sortOrder,
          },
        });
      }
    }
  }

  await tx.goLiveChecklistItem.create({
    data: {
      projectId,
      title: "Final go-live approval",
      description: "Implementation lead confirms production readiness",
      isMandatory: true,
      sortOrder: 999,
    },
  });
}

export async function provisionImplementationProject(
  input: {
    businessId: string;
    contractId: string;
    customerId: string;
    name: string;
    assignedStaffId?: string | null;
    industry?: string | null;
    templateId?: string | null;
  },
  staffId: string | null,
  tx: Prisma.TransactionClient = prisma,
): Promise<string> {
  await ensureDefaultProjectTemplates(input.businessId);

  const industry = input.industry?.trim() || "hospitality";
  const template =
    input.templateId != null
      ? await tx.projectTemplate.findFirst({
          where: { id: input.templateId, businessId: input.businessId },
        })
      : await tx.projectTemplate.findFirst({
          where: { businessId: input.businessId, industry, isActive: true },
          orderBy: { createdAt: "asc" },
        });

  const startedAt = new Date();
  const portalToken = randomUUID();

  const project = await tx.implementationProject.create({
    data: {
      businessId: input.businessId,
      contractId: input.contractId,
      customerId: input.customerId,
      templateId: template?.id ?? null,
      name: input.name,
      industry,
      status: "IN_PROGRESS",
      assignedStaffId: input.assignedStaffId ?? null,
      portalToken,
      startedAt,
    },
  });

  if (template) {
    await applyTemplateToProject(project.id, template.id, startedAt, tx);
  }

  await logImplementationAudit(
    input.businessId,
    {
      staffId,
      entityType: "implementation_project",
      entityId: project.id,
      action: "provisioned",
      metadata: { contractId: input.contractId, templateId: template?.id },
    },
    tx,
  );

  return project.id;
}

export async function listImplementationProjects(
  businessId: string,
): Promise<ImplementationProjectData[]> {
  const projects = await prisma.implementationProject.findMany({
    where: { businessId },
    orderBy: { updatedAt: "desc" },
  });

  return Promise.all(projects.map((project) => loadProject(project.id, businessId)));
}

export async function getImplementationProject(
  projectId: string,
  businessId: string,
): Promise<ImplementationProjectData> {
  return loadProject(projectId, businessId);
}

export async function assignImplementationProject(
  projectId: string,
  businessId: string,
  staffId: string | null,
  assignedStaffId: string | null,
): Promise<ImplementationProjectData> {
  await prisma.implementationProject.updateMany({
    where: { id: projectId, businessId },
    data: { assignedStaffId },
  });

  await logImplementationAudit(businessId, {
    staffId,
    entityType: "implementation_project",
    entityId: projectId,
    action: "assigned",
    metadata: { assignedStaffId },
  });

  return loadProject(projectId, businessId);
}

export async function updateImplementationTaskStatus(
  taskId: string,
  businessId: string,
  staffId: string | null,
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "BLOCKED" | "CANCELLED",
): Promise<void> {
  const task = await prisma.implementationTask.findFirst({
    where: { id: taskId, project: { businessId } },
  });
  if (!task) {
    throw new Error("Task not found");
  }

  await prisma.implementationTask.update({
    where: { id: taskId },
    data: {
      status,
      completedAt: status === "COMPLETED" ? new Date() : null,
    },
  });

  if (task.isMandatoryForGoLive && status === "COMPLETED") {
    await prisma.goLiveChecklistItem.updateMany({
      where: { projectId: task.projectId, title: task.title, status: "PENDING" },
      data: { status: "COMPLETED", completedAt: new Date(), completedByStaffId: staffId },
    });
  }

  await logImplementationAudit(businessId, {
    staffId,
    entityType: "implementation_task",
    entityId: taskId,
    action: "status_updated",
    metadata: { status },
  });

  if (status === "COMPLETED" && task.milestoneId) {
    const { maybeGenerateMilestoneInvoice } = await import("@/services/revops.service");
    await maybeGenerateMilestoneInvoice(task.milestoneId, businessId, staffId);
  }
}

export async function completeGoLiveChecklistItem(
  itemId: string,
  businessId: string,
  staffId: string | null,
): Promise<void> {
  const item = await prisma.goLiveChecklistItem.findFirst({
    where: { id: itemId, project: { businessId } },
  });
  if (!item) {
    throw new Error("Checklist item not found");
  }

  await prisma.goLiveChecklistItem.update({
    where: { id: itemId },
    data: { status: "COMPLETED", completedAt: new Date(), completedByStaffId: staffId },
  });
}

export async function executeGoLive(
  projectId: string,
  businessId: string,
  staffId: string | null,
): Promise<ImplementationProjectData> {
  const project = await prisma.implementationProject.findFirst({
    where: { id: projectId, businessId },
    include: { goLiveChecklist: true, hypercare: true },
  });
  if (!project) {
    throw new Error("Project not found");
  }

  const incompleteMandatory = project.goLiveChecklist.filter(
    (item) => item.isMandatory && item.status !== "COMPLETED",
  );
  if (incompleteMandatory.length > 0) {
    throw new Error("Mandatory go-live checklist items must be completed before go-live");
  }

  const now = new Date();
  const hypercareEndsAt = new Date(now);
  hypercareEndsAt.setDate(hypercareEndsAt.getDate() + HYPERCARE_DAYS);

  await prisma.$transaction(async (tx) => {
    await tx.implementationProject.update({
      where: { id: projectId },
      data: { goLiveAt: now, status: "HYPERCARE" },
    });

    if (project.hypercare) {
      await tx.implementationHypercare.update({
        where: { projectId },
        data: { status: "ACTIVE", startedAt: now, endsAt: hypercareEndsAt },
      });
    } else {
      await tx.implementationHypercare.create({
        data: {
          projectId,
          status: "ACTIVE",
          startedAt: now,
          endsAt: hypercareEndsAt,
        },
      });
    }

    await logImplementationAudit(
      businessId,
      {
        staffId,
        entityType: "implementation_project",
        entityId: projectId,
        action: "go_live",
        metadata: { hypercareEndsAt: hypercareEndsAt.toISOString() },
      },
      tx,
    );
  });

  return loadProject(projectId, businessId);
}

export async function createImplementationRisk(
  projectId: string,
  businessId: string,
  staffId: string | null,
  input: {
    title: string;
    description?: string | null;
    severity?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  },
): Promise<void> {
  const project = await prisma.implementationProject.findFirst({
    where: { id: projectId, businessId },
  });
  if (!project) {
    throw new Error("Project not found");
  }

  await prisma.implementationRisk.create({
    data: {
      projectId,
      title: input.title.trim(),
      description: input.description ?? null,
      severity: input.severity ?? "MEDIUM",
    },
  });

  await logImplementationAudit(businessId, {
    staffId,
    entityType: "implementation_risk",
    entityId: projectId,
    action: "created",
  });
}

export async function createImplementationIssue(
  projectId: string,
  businessId: string,
  staffId: string | null,
  input: {
    title: string;
    description?: string | null;
    reportedByCustomer?: boolean;
  },
): Promise<void> {
  const project = await prisma.implementationProject.findFirst({
    where: { id: projectId, businessId },
  });
  if (!project) {
    throw new Error("Project not found");
  }

  await prisma.implementationIssue.create({
    data: {
      projectId,
      title: input.title.trim(),
      description: input.description ?? null,
      reportedByCustomer: input.reportedByCustomer ?? false,
    },
  });
}

export async function createChangeRequest(
  projectId: string,
  businessId: string,
  staffId: string | null,
  input: {
    title: string;
    description?: string | null;
    requestedByName?: string | null;
    requestedByEmail?: string | null;
  },
): Promise<void> {
  const project = await prisma.implementationProject.findFirst({
    where: { id: projectId, businessId },
  });
  if (!project) {
    throw new Error("Project not found");
  }

  await prisma.implementationChangeRequest.create({
    data: {
      projectId,
      title: input.title.trim(),
      description: input.description ?? null,
      requestedByName: input.requestedByName ?? null,
      requestedByEmail: input.requestedByEmail ?? null,
      status: "SUBMITTED",
    },
  });

  await logImplementationAudit(businessId, {
    staffId,
    entityType: "change_request",
    entityId: projectId,
    action: "submitted",
  });
}

export async function reviewChangeRequest(
  changeRequestId: string,
  businessId: string,
  staffId: string | null,
  approved: boolean,
): Promise<void> {
  const changeRequest = await prisma.implementationChangeRequest.findFirst({
    where: { id: changeRequestId, project: { businessId } },
  });
  if (!changeRequest) {
    throw new Error("Change request not found");
  }

  await prisma.implementationChangeRequest.update({
    where: { id: changeRequestId },
    data: {
      status: approved ? "APPROVED" : "REJECTED",
      approvedByStaffId: staffId,
      approvedAt: new Date(),
    },
  });

  await logImplementationAudit(businessId, {
    staffId,
    entityType: "change_request",
    entityId: changeRequestId,
    action: approved ? "approved" : "rejected",
  });
}

export async function closeImplementationProject(
  projectId: string,
  businessId: string,
  staffId: string | null,
): Promise<ImplementationProjectData> {
  const project = await prisma.implementationProject.findFirst({
    where: { id: projectId, businessId },
    include: { hypercare: true },
  });
  if (!project) {
    throw new Error("Project not found");
  }

  if (project.hypercare?.status === "ACTIVE" && project.hypercare.endsAt > new Date()) {
    throw new Error("Hypercare period must complete before closing the project");
  }

  await prisma.$transaction(async (tx) => {
    await tx.implementationProject.update({
      where: { id: projectId },
      data: { status: "CLOSED", closedAt: new Date(), completedAt: new Date() },
    });

    if (project.hypercare) {
      await tx.implementationHypercare.update({
        where: { projectId },
        data: { status: "COMPLETED", completedAt: new Date() },
      });
    }

    await logImplementationAudit(
      businessId,
      { staffId, entityType: "implementation_project", entityId: projectId, action: "closed" },
      tx,
    );
  });

  return loadProject(projectId, businessId);
}

export async function getImplementationPortalView(portalToken: string): Promise<{
  project: ImplementationProjectData;
  milestones: Array<{ id: string; name: string; status: string; dueAt: Date | null }>;
  tasks: Array<{ id: string; title: string; status: string; dueAt: Date | null }>;
  issues: Array<{ id: string; title: string; status: string }>;
}> {
  const project = await prisma.implementationProject.findFirst({
    where: { portalToken },
    include: {
      customer: true,
      milestones: { orderBy: { sortOrder: "asc" } },
      tasks: { where: { visibleToCustomer: true }, orderBy: { createdAt: "asc" } },
      issues: { where: { reportedByCustomer: true }, orderBy: { createdAt: "desc" } },
      goLiveChecklist: true,
      hypercare: true,
      risks: { where: { status: "OPEN" } },
      changeRequests: { where: { status: "SUBMITTED" } },
      _count: { select: { milestones: true, tasks: true, changeRequests: true } },
    },
  });

  if (!project) {
    throw new Error("Portal not found");
  }

  const mandatoryIncomplete = project.goLiveChecklist.filter(
    (item) => item.isMandatory && item.status !== "COMPLETED",
  );

  const projectData: ImplementationProjectData = {
    id: project.id,
    businessId: project.businessId,
    contractId: project.contractId,
    customerId: project.customerId,
    customerName: project.customer.name,
    templateId: project.templateId,
    name: project.name,
    industry: project.industry,
    status: project.status,
    assignedStaffId: project.assignedStaffId,
    portalToken: project.portalToken,
    startedAt: project.startedAt,
    goLiveAt: project.goLiveAt,
    milestoneCount: project._count.milestones,
    taskCount: project._count.tasks,
    openRiskCount: project.risks.length,
    openIssueCount: project.issues.length,
    pendingChangeRequests: project.changeRequests.length,
    goLiveChecklistComplete: mandatoryIncomplete.length === 0,
    hypercareActive: project.hypercare?.status === "ACTIVE",
  };

  return {
    project: projectData,
    milestones: project.milestones.map((milestone) => ({
      id: milestone.id,
      name: milestone.name,
      status: milestone.status,
      dueAt: milestone.dueAt,
    })),
    tasks: project.tasks.map((task) => ({
      id: task.id,
      title: task.title,
      status: task.status,
      dueAt: task.dueAt,
    })),
    issues: project.issues.map((issue) => ({
      id: issue.id,
      title: issue.title,
      status: issue.status,
    })),
  };
}

export async function getImplementationDashboard(
  businessId: string,
): Promise<ImplementationDashboardData> {
  const [projects, openRisks, openIssues] = await Promise.all([
    prisma.implementationProject.findMany({ where: { businessId } }),
    prisma.implementationRisk.count({ where: { project: { businessId }, status: "OPEN" } }),
    prisma.implementationIssue.count({
      where: { project: { businessId }, status: { in: ["OPEN", "IN_PROGRESS"] } },
    }),
  ]);

  return {
    totalProjects: projects.length,
    inProgressProjects: projects.filter((project) => project.status === "IN_PROGRESS").length,
    hypercareProjects: projects.filter((project) => project.status === "HYPERCARE").length,
    completedProjects: projects.filter(
      (project) => project.status === "COMPLETED" || project.status === "CLOSED",
    ).length,
    openRisks,
    openIssues,
  };
}

export const IMPLEMENTATION_HYPERCARE_DAYS = HYPERCARE_DAYS;

export interface ImplementationMilestoneData {
  id: string;
  projectId: string;
  projectName: string;
  name: string;
  status: string;
  dueAt: Date | null;
}

export interface ImplementationTaskData {
  id: string;
  projectId: string;
  projectName: string;
  title: string;
  status: string;
  priority: string;
  dueAt: Date | null;
  isMandatoryForGoLive: boolean;
}

export interface ImplementationRiskData {
  id: string;
  projectId: string;
  projectName: string;
  title: string;
  severity: string;
  status: string;
}

export interface ImplementationIssueData {
  id: string;
  projectId: string;
  projectName: string;
  title: string;
  status: string;
  reportedByCustomer: boolean;
}

export interface ImplementationChangeRequestData {
  id: string;
  projectId: string;
  projectName: string;
  title: string;
  status: string;
  requestedByName: string | null;
}

export interface GoLiveChecklistItemData {
  id: string;
  projectId: string;
  projectName: string;
  title: string;
  isMandatory: boolean;
  status: string;
}

export interface ImplementationHypercareData {
  id: string;
  projectId: string;
  projectName: string;
  status: string;
  startedAt: Date;
  endsAt: Date;
}

export async function listImplementationMilestones(
  businessId: string,
): Promise<ImplementationMilestoneData[]> {
  const milestones = await prisma.implementationMilestone.findMany({
    where: { project: { businessId } },
    include: { project: true },
    orderBy: [{ projectId: "asc" }, { sortOrder: "asc" }],
  });

  return milestones.map((milestone) => ({
    id: milestone.id,
    projectId: milestone.projectId,
    projectName: milestone.project.name,
    name: milestone.name,
    status: milestone.status,
    dueAt: milestone.dueAt,
  }));
}

export async function listImplementationTasks(
  businessId: string,
): Promise<ImplementationTaskData[]> {
  const tasks = await prisma.implementationTask.findMany({
    where: { project: { businessId } },
    include: { project: true },
    orderBy: [{ projectId: "asc" }, { createdAt: "asc" }],
  });

  return tasks.map((task) => ({
    id: task.id,
    projectId: task.projectId,
    projectName: task.project.name,
    title: task.title,
    status: task.status,
    priority: task.priority,
    dueAt: task.dueAt,
    isMandatoryForGoLive: task.isMandatoryForGoLive,
  }));
}

export async function listImplementationRisks(
  businessId: string,
): Promise<ImplementationRiskData[]> {
  const risks = await prisma.implementationRisk.findMany({
    where: { project: { businessId } },
    include: { project: true },
    orderBy: { createdAt: "desc" },
  });

  return risks.map((risk) => ({
    id: risk.id,
    projectId: risk.projectId,
    projectName: risk.project.name,
    title: risk.title,
    severity: risk.severity,
    status: risk.status,
  }));
}

export async function listImplementationIssues(
  businessId: string,
): Promise<ImplementationIssueData[]> {
  const issues = await prisma.implementationIssue.findMany({
    where: { project: { businessId } },
    include: { project: true },
    orderBy: { createdAt: "desc" },
  });

  return issues.map((issue) => ({
    id: issue.id,
    projectId: issue.projectId,
    projectName: issue.project.name,
    title: issue.title,
    status: issue.status,
    reportedByCustomer: issue.reportedByCustomer,
  }));
}

export async function listImplementationChangeRequests(
  businessId: string,
): Promise<ImplementationChangeRequestData[]> {
  const changeRequests = await prisma.implementationChangeRequest.findMany({
    where: { project: { businessId } },
    include: { project: true },
    orderBy: { createdAt: "desc" },
  });

  return changeRequests.map((changeRequest) => ({
    id: changeRequest.id,
    projectId: changeRequest.projectId,
    projectName: changeRequest.project.name,
    title: changeRequest.title,
    status: changeRequest.status,
    requestedByName: changeRequest.requestedByName,
  }));
}

export async function listGoLiveChecklistItems(
  businessId: string,
): Promise<GoLiveChecklistItemData[]> {
  const items = await prisma.goLiveChecklistItem.findMany({
    where: { project: { businessId } },
    include: { project: true },
    orderBy: [{ projectId: "asc" }, { sortOrder: "asc" }],
  });

  return items.map((item) => ({
    id: item.id,
    projectId: item.projectId,
    projectName: item.project.name,
    title: item.title,
    isMandatory: item.isMandatory,
    status: item.status,
  }));
}

export async function listImplementationHypercare(
  businessId: string,
): Promise<ImplementationHypercareData[]> {
  const hypercareRecords = await prisma.implementationHypercare.findMany({
    where: { project: { businessId } },
    include: { project: true },
    orderBy: { startedAt: "desc" },
  });

  return hypercareRecords.map((hypercare) => ({
    id: hypercare.id,
    projectId: hypercare.projectId,
    projectName: hypercare.project.name,
    status: hypercare.status,
    startedAt: hypercare.startedAt,
    endsAt: hypercare.endsAt,
  }));
}

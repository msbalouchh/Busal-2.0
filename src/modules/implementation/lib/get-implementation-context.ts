import { cache } from "react";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedPage } from "@/modules/platform-guards/guards/page.guards";
import {
  serializeImplementationDashboard,
  serializeImplementationProject,
} from "@/modules/implementation/utils/implementation-utils";
import {
  getImplementationDashboard,
  listGoLiveChecklistItems,
  listImplementationChangeRequests,
  listImplementationHypercare,
  listImplementationIssues,
  listImplementationMilestones,
  listImplementationProjects,
  listImplementationRisks,
  listImplementationTasks,
  listProjectTemplates,
} from "@/services/implementation-delivery.service";

export const getImplementationOverviewContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.IMPLEMENTATION_VIEW });
  const dashboard = await getImplementationDashboard(context.business.id);

  return {
    context,
    dashboard: serializeImplementationDashboard(dashboard),
  };
});

export const getImplementationProjectsContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.IMPLEMENTATION_VIEW });
  const projects = await listImplementationProjects(context.business.id);

  return {
    context,
    projects: projects.map(serializeImplementationProject),
  };
});

export const getProjectTemplatesContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.IMPLEMENTATION_VIEW });
  const templates = await listProjectTemplates(context.business.id);

  return { context, templates };
});

export const getImplementationMilestonesContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.IMPLEMENTATION_VIEW });
  const milestones = await listImplementationMilestones(context.business.id);

  return { context, milestones };
});

export const getImplementationTasksContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.IMPLEMENTATION_VIEW });
  const tasks = await listImplementationTasks(context.business.id);

  return { context, tasks };
});

export const getImplementationRisksContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.IMPLEMENTATION_VIEW });
  const risks = await listImplementationRisks(context.business.id);

  return { context, risks };
});

export const getImplementationIssuesContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.IMPLEMENTATION_VIEW });
  const issues = await listImplementationIssues(context.business.id);

  return { context, issues };
});

export const getImplementationChangeRequestsContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.IMPLEMENTATION_VIEW });
  const changeRequests = await listImplementationChangeRequests(context.business.id);

  return { context, changeRequests };
});

export const getGoLiveChecklistContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.IMPLEMENTATION_VIEW });
  const checklist = await listGoLiveChecklistItems(context.business.id);

  return { context, checklist };
});

export const getImplementationHypercareContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.IMPLEMENTATION_VIEW });
  const hypercare = await listImplementationHypercare(context.business.id);

  return { context, hypercare };
});

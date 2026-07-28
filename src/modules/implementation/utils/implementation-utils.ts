import type {
  ImplementationDashboardData,
  ImplementationProjectData,
  ProjectTemplateData,
} from "@/services/implementation-delivery.service";

export type ImplementationDashboardView = ImplementationDashboardData;
export type ImplementationProjectView = ImplementationProjectData;
export type ProjectTemplateView = ProjectTemplateData;

export function serializeImplementationDashboard(
  dashboard: ImplementationDashboardData,
): ImplementationDashboardView {
  return dashboard;
}

export function serializeImplementationProject(
  project: ImplementationProjectData,
): ImplementationProjectView {
  return project;
}

import Link from "next/link";

import { COMMERCIAL_PLATFORM_ROUTES } from "@/modules/commercial-platform/constants/commercial-platform";
import { ImplementationProjectsList } from "@/modules/implementation/components/implementation-lists";
import type {
  ImplementationDashboardView,
  ImplementationProjectView,
} from "@/modules/implementation/utils/implementation-utils";

interface CommercialProjectsPanelProps {
  projects: ImplementationProjectView[];
  dashboard: ImplementationDashboardView;
}

export function CommercialProjectsPanel({ projects, dashboard }: CommercialProjectsPanelProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border p-4">
          <p className="text-muted-foreground text-sm">Total projects</p>
          <p className="text-2xl font-semibold">{dashboard.totalProjects}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-muted-foreground text-sm">In progress</p>
          <p className="text-2xl font-semibold">{dashboard.inProgressProjects}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-muted-foreground text-sm">Hypercare</p>
          <p className="text-2xl font-semibold">{dashboard.hypercareProjects}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-muted-foreground text-sm">Open issues</p>
          <p className="text-2xl font-semibold">{dashboard.openIssues}</p>
        </div>
      </div>

      <ImplementationProjectsList projects={projects.slice(0, 10)} />

      <Link
        href={COMMERCIAL_PLATFORM_ROUTES.implementationModule}
        className="text-primary text-sm hover:underline"
      >
        Open milestones, tasks, and timeline in Implementation module
      </Link>
    </div>
  );
}

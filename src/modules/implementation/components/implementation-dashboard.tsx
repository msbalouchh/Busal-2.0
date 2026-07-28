import type { ImplementationDashboardView } from "@/modules/implementation/utils/implementation-utils";
import { IMPLEMENTATION_HYPERCARE_DAYS } from "@/services/implementation-delivery.service";

interface ImplementationDashboardProps {
  dashboard: ImplementationDashboardView;
}

export function ImplementationDashboard({ dashboard }: ImplementationDashboardProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <p className="text-muted-foreground text-sm">Total Projects</p>
          <p className="text-2xl font-semibold">{dashboard.totalProjects}</p>
        </div>
        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <p className="text-muted-foreground text-sm">In Progress</p>
          <p className="text-2xl font-semibold">{dashboard.inProgressProjects}</p>
        </div>
        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <p className="text-muted-foreground text-sm">Hypercare</p>
          <p className="text-2xl font-semibold">{dashboard.hypercareProjects}</p>
        </div>
        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <p className="text-muted-foreground text-sm">Completed / Closed</p>
          <p className="text-2xl font-semibold">{dashboard.completedProjects}</p>
        </div>
        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <p className="text-muted-foreground text-sm">Open Risks</p>
          <p className="text-2xl font-semibold">{dashboard.openRisks}</p>
        </div>
        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <p className="text-muted-foreground text-sm">Open Issues</p>
          <p className="text-2xl font-semibold">{dashboard.openIssues}</p>
        </div>
      </div>
      <p className="text-muted-foreground text-xs">
        Go-live automatically starts a {IMPLEMENTATION_HYPERCARE_DAYS}-day hypercare phase.
      </p>
    </div>
  );
}

import type { Metadata } from "next";

import { CommercialProjectsPanel } from "@/modules/commercial-platform/components/commercial-projects-panel";
import { getCommercialProjectsContext } from "@/modules/commercial-platform/lib/get-commercial-platform-context";

export const metadata: Metadata = {
  title: "Projects & Implementations",
};

export default async function CommercialProjectsPage() {
  const { projects, dashboard } = await getCommercialProjectsContext();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Projects & Implementations</h1>
        <p className="text-muted-foreground text-sm">
          Project dashboard, tasks, milestones, assigned team, progress, and timeline.
        </p>
      </div>
      <CommercialProjectsPanel projects={projects} dashboard={dashboard} />
    </div>
  );
}

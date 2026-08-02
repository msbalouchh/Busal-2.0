import type { Metadata } from "next";

import { CommercialLeadsPanel } from "@/modules/commercial-platform/components/commercial-leads-panel";
import { getCommercialLeadsContext } from "@/modules/commercial-platform/lib/get-commercial-platform-context";

export const metadata: Metadata = {
  title: "Lead Management",
};

export default async function CommercialLeadsPage() {
  const { directory, allLeads, permissions } = await getCommercialLeadsContext();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Lead Management</h1>
        <p className="text-muted-foreground text-sm">
          Lead list, pipeline view, status, source tracking, notes, and follow-ups.
        </p>
      </div>
      <CommercialLeadsPanel
        initialDirectory={directory}
        allLeads={allLeads}
        permissions={permissions}
      />
    </div>
  );
}

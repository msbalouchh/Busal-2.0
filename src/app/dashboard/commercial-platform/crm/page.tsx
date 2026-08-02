import type { Metadata } from "next";

import { CommercialCrmPanel } from "@/modules/commercial-platform/components/commercial-crm-panel";
import { getCommercialCrmContext } from "@/modules/commercial-platform/lib/get-commercial-platform-context";

export const metadata: Metadata = {
  title: "CRM Dashboard",
};

export default async function CommercialCrmPage() {
  const { sales, crm, recentActivities } = await getCommercialCrmContext();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">CRM Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          Sales overview, pipeline, opportunities, customer summary, revenue, and recent activity.
        </p>
      </div>
      <CommercialCrmPanel sales={sales} crm={crm} recentActivities={recentActivities} />
    </div>
  );
}

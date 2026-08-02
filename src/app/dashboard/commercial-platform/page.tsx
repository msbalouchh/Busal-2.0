import type { Metadata } from "next";

import { CommercialPlatformOverview } from "@/modules/commercial-platform/components/commercial-platform-overview";
import { getCommercialPlatformContext } from "@/modules/commercial-platform/lib/get-commercial-platform-context";

export const metadata: Metadata = {
  title: "Commercial Platform",
};

export default async function CommercialPlatformPage() {
  const { widgets, permissions, recentActivities } = await getCommercialPlatformContext();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Commercial Platform</h1>
        <p className="text-muted-foreground text-sm">
          Sales overview, pipeline, customers, quotes, contracts, projects, success, and revenue.
        </p>
      </div>
      <CommercialPlatformOverview
        widgets={widgets}
        permissions={permissions}
        recentActivities={recentActivities}
      />
    </div>
  );
}

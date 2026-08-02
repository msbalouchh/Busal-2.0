import type { Metadata } from "next";

import { KitchenDashboardPanel } from "@/modules/kitchen-display-management/components/kitchen-dashboard-panel";
import { getKitchenDashboardContext } from "@/modules/kitchen-display-management/lib/get-kitchen-display-context";

interface KitchenFullscreenPageProps {
  searchParams: Promise<{ branchId?: string; stationId?: string; search?: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Kitchen Display — Full Screen" };
}

export default async function KitchenFullscreenPage({ searchParams }: KitchenFullscreenPageProps) {
  const params = await searchParams;
  const context = await getKitchenDashboardContext(
    params.branchId ?? "",
    params.stationId,
    params.search,
  );

  return (
    <div className="bg-background min-h-screen">
      <KitchenDashboardPanel
        context={context}
        queue={context.queue}
        stats={context.stats}
        stations={context.stations}
        initialStationId={params.stationId ?? ""}
        initialSearch={params.search ?? ""}
        fullscreen
      />
    </div>
  );
}

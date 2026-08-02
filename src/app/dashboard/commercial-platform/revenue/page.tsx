import type { Metadata } from "next";

import { CommercialRevenuePanel } from "@/modules/commercial-platform/components/commercial-revenue-panel";
import { getCommercialRevenueContext } from "@/modules/commercial-platform/lib/get-commercial-platform-context";

export const metadata: Metadata = {
  title: "Revenue Operations",
};

export default async function CommercialRevenuePage() {
  const { invoices, dashboard, widgets } = await getCommercialRevenueContext();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Revenue Operations</h1>
        <p className="text-muted-foreground text-sm">
          Revenue, invoices, outstanding payments, subscriptions, MRR, ARR, and growth metrics.
        </p>
      </div>
      <CommercialRevenuePanel invoices={invoices} dashboard={dashboard} widgets={widgets} />
    </div>
  );
}

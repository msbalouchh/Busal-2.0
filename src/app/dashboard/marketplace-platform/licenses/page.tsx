import type { Metadata } from "next";

import { MarketplaceLicensesPanel } from "@/modules/marketplace-platform/components/marketplace-licenses-panel";
import { getMarketplacePlatformLicensesContext } from "@/modules/marketplace-platform/lib/get-marketplace-platform-context";

export const metadata: Metadata = {
  title: "License Management",
};

export default async function MarketplacePlatformLicensesPage() {
  const { permissions, licenses, widgets } = await getMarketplacePlatformLicensesContext();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">License Management</h1>
        <p className="text-muted-foreground text-sm">
          Purchased licenses, active seats, expiring subscriptions, and renewal status.
        </p>
      </div>
      <MarketplaceLicensesPanel permissions={permissions} licenses={licenses} widgets={widgets} />
    </div>
  );
}

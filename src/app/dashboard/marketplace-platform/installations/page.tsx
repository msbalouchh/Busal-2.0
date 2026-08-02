import type { Metadata } from "next";

import { MarketplaceInstallationsPanel } from "@/modules/marketplace-platform/components/marketplace-installations-panel";
import { getMarketplacePlatformInstallationsContext } from "@/modules/marketplace-platform/lib/get-marketplace-platform-context";

export const metadata: Metadata = {
  title: "Installation Manager",
};

export default async function MarketplacePlatformInstallationsPage() {
  const { permissions, installations, history } =
    await getMarketplacePlatformInstallationsContext();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Installation Manager</h1>
        <p className="text-muted-foreground text-sm">
          Install, update, uninstall, rollback, and track installation status.
        </p>
      </div>
      <MarketplaceInstallationsPanel
        permissions={permissions}
        installations={installations}
        history={history}
      />
    </div>
  );
}

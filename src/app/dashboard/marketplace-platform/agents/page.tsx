import type { Metadata } from "next";

import { MarketplaceAgentsPanel } from "@/modules/marketplace-platform/components/marketplace-agents-panel";
import { getMarketplacePlatformAgentsContext } from "@/modules/marketplace-platform/lib/get-marketplace-platform-context";

export const metadata: Metadata = {
  title: "AI Agent Store",
};

export default async function MarketplacePlatformAgentsPage() {
  const { permissions, agents, installations } = await getMarketplacePlatformAgentsContext();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">AI Agent Store</h1>
        <p className="text-muted-foreground text-sm">
          Browse, install, assign, and configure marketplace AI agents.
        </p>
      </div>
      <MarketplaceAgentsPanel
        permissions={permissions}
        agents={agents}
        installations={installations}
      />
    </div>
  );
}

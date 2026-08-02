import type { Metadata } from "next";

import { CommercialContractsPanel } from "@/modules/commercial-platform/components/commercial-contracts-panel";
import { getCommercialContractsContext } from "@/modules/commercial-platform/lib/get-commercial-platform-context";

export const metadata: Metadata = {
  title: "Contracts",
};

export default async function CommercialContractsPage() {
  const { contracts, dashboard } = await getCommercialContractsContext();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Contracts</h1>
        <p className="text-muted-foreground text-sm">
          Contract list, renewal dates, expiry alerts, status, and attached documents.
        </p>
      </div>
      <CommercialContractsPanel contracts={contracts} dashboard={dashboard} />
    </div>
  );
}

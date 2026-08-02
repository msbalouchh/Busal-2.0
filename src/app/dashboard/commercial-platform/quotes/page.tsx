import type { Metadata } from "next";

import { CommercialQuotesPanel } from "@/modules/commercial-platform/components/commercial-quotes-panel";
import { getCommercialQuotesContext } from "@/modules/commercial-platform/lib/get-commercial-platform-context";

export const metadata: Metadata = {
  title: "Quotes & Proposals",
};

export default async function CommercialQuotesPage() {
  const { quotes, proposals, dashboard, permissions } = await getCommercialQuotesContext();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Quotes & Proposals</h1>
        <p className="text-muted-foreground text-sm">
          Create, edit, duplicate, send, preview, and export quotes and proposals.
        </p>
      </div>
      <CommercialQuotesPanel
        quotes={quotes}
        proposals={proposals}
        dashboard={dashboard}
        permissions={permissions}
      />
    </div>
  );
}

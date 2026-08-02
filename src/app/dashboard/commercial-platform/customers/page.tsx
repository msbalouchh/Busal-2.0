import type { Metadata } from "next";

import { CommercialCustomersPanel } from "@/modules/commercial-platform/components/commercial-customers-panel";
import { getCommercialCustomersContext } from "@/modules/commercial-platform/lib/get-commercial-platform-context";

export const metadata: Metadata = {
  title: "Customer Management",
};

export default async function CommercialCustomersPage() {
  const { customers, dashboard } = await getCommercialCustomersContext();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Customer Management</h1>
        <p className="text-muted-foreground text-sm">
          Customer directory, profiles, contacts, timeline, and documents.
        </p>
      </div>
      <CommercialCustomersPanel customers={customers} dashboard={dashboard} />
    </div>
  );
}

import type { Metadata } from "next";

import { CommercialCustomerSuccessPanel } from "@/modules/commercial-platform/components/commercial-customer-success-panel";
import { getCommercialCustomerSuccessContext } from "@/modules/commercial-platform/lib/get-commercial-platform-context";

export const metadata: Metadata = {
  title: "Customer Success",
};

export default async function CommercialCustomerSuccessPage() {
  const { profiles, dashboard } = await getCommercialCustomerSuccessContext();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Customer Success</h1>
        <p className="text-muted-foreground text-sm">
          Customer health, renewal status, active services, support history, and success notes.
        </p>
      </div>
      <CommercialCustomerSuccessPanel profiles={profiles} dashboard={dashboard} />
    </div>
  );
}

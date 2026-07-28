import type { Metadata } from "next";

import { BusinessOverview } from "@/modules/business/components/business-overview";
import { BusinessPageHeader } from "@/modules/business/components/business-page-header";
import { getBusinessModuleContext } from "@/modules/business/lib/get-business-context";

export const metadata: Metadata = {
  title: "Business Overview",
};

export default async function BusinessOverviewPage() {
  const { business, branches, hours, contacts } = await getBusinessModuleContext();

  return (
    <div className="space-y-6">
      <BusinessPageHeader
        title="Business Overview"
        description="Read-only summary of your business profile, branches, hours, and contact details."
      />
      <BusinessOverview business={business} branches={branches} hours={hours} contacts={contacts} />
    </div>
  );
}

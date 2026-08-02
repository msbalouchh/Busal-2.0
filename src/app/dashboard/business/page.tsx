import type { Metadata } from "next";

import { BusinessOverview } from "@/modules/business/components/business-overview";
import { BusinessPageHeader } from "@/modules/business/components/business-page-header";
import { getBusinessProfileContext } from "@/modules/business/lib/get-business-profile-context";

export const metadata: Metadata = {
  title: "Business Overview",
};

export default async function BusinessOverviewPage() {
  const { profile } = await getBusinessProfileContext();

  return (
    <div className="space-y-6">
      <BusinessPageHeader
        title="Business Overview"
        description="Summary of your business profile, regional settings, contact details, and branches."
      />
      <BusinessOverview profile={profile} />
    </div>
  );
}

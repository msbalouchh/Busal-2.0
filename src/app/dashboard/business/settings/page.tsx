import type { Metadata } from "next";

import { BusinessSettingsPanel } from "@/modules/business/components/business-settings-panel";
import { BusinessPageHeader } from "@/modules/business/components/business-page-header";
import { getBusinessProfileContext } from "@/modules/business/lib/get-business-profile-context";

export const metadata: Metadata = {
  title: "Business Settings",
};

export default async function BusinessSettingsPage() {
  const { profile } = await getBusinessProfileContext();

  return (
    <div className="space-y-6">
      <BusinessPageHeader
        title="Business Settings"
        description="Configure general preferences, operational defaults, and business status."
      />
      <BusinessSettingsPanel profile={profile} />
    </div>
  );
}

import type { Metadata } from "next";

import { BusinessPageHeader } from "@/modules/business/components/business-page-header";
import { BusinessSettingsPlaceholder } from "@/modules/business/components/business-settings-placeholder";

export const metadata: Metadata = {
  title: "Business Settings",
};

export default function BusinessSettingsPage() {
  return (
    <div className="space-y-6">
      <BusinessPageHeader
        title="Business Settings"
        description="Additional business configuration options will appear here."
      />
      <BusinessSettingsPlaceholder />
    </div>
  );
}

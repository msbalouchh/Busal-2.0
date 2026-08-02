import type { Metadata } from "next";

import { BusinessBrandingPanel } from "@/modules/business/components/business-branding-panel";
import { BusinessPageHeader } from "@/modules/business/components/business-page-header";
import { getBusinessProfileContext } from "@/modules/business/lib/get-business-profile-context";

export const metadata: Metadata = {
  title: "Business Branding",
};

export default async function BusinessBrandingPage() {
  const { profile } = await getBusinessProfileContext();

  return (
    <div className="space-y-6">
      <BusinessPageHeader
        title="Branding"
        description="Upload brand assets, configure colours, and preview your theme."
      />
      <BusinessBrandingPanel profile={profile} />
    </div>
  );
}

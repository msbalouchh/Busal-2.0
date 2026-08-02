import type { Metadata } from "next";

import { BusinessProfileForm } from "@/modules/business/components/business-profile-form";
import { BusinessPageHeader } from "@/modules/business/components/business-page-header";
import { getBusinessProfileContext } from "@/modules/business/lib/get-business-profile-context";

export const metadata: Metadata = {
  title: "Business Profile",
};

export default async function BusinessProfilePage() {
  const { profile } = await getBusinessProfileContext();

  return (
    <div className="space-y-6">
      <BusinessPageHeader
        title="Business Profile"
        description="Manage your business identity, legal details, and regional defaults."
      />
      <BusinessProfileForm profile={profile} />
    </div>
  );
}

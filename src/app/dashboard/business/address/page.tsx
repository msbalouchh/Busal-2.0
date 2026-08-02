import type { Metadata } from "next";

import { BusinessAddressForm } from "@/modules/business/components/business-address-form";
import { BusinessPageHeader } from "@/modules/business/components/business-page-header";
import { getBusinessProfileContext } from "@/modules/business/lib/get-business-profile-context";

export const metadata: Metadata = {
  title: "Business Address",
};

export default async function BusinessAddressPage() {
  const { profile } = await getBusinessProfileContext();

  return (
    <div className="space-y-6">
      <BusinessPageHeader
        title="Business Address"
        description="Keep your registered business address up to date across Busal OS."
      />
      <BusinessAddressForm profile={profile} />
    </div>
  );
}

import type { Metadata } from "next";

import { BusinessContactForm } from "@/modules/business/components/business-contact-form";
import { BusinessPageHeader } from "@/modules/business/components/business-page-header";
import { getBusinessProfileContext } from "@/modules/business/lib/get-business-profile-context";

export const metadata: Metadata = {
  title: "Contact Information",
};

export default async function BusinessContactPage() {
  const { profile } = await getBusinessProfileContext();

  return (
    <div className="space-y-6">
      <BusinessPageHeader
        title="Contact Information"
        description="Manage email, phone, website, support, and social links."
      />
      <BusinessContactForm profile={profile} />
    </div>
  );
}

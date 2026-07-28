import type { Metadata } from "next";

import { BusinessGeneralForm } from "@/modules/business/components/business-general-form";
import { BusinessPageHeader } from "@/modules/business/components/business-page-header";
import { getBusinessModuleContext } from "@/modules/business/lib/get-business-context";

export const metadata: Metadata = {
  title: "General Information",
};

export default async function BusinessGeneralPage() {
  const { business } = await getBusinessModuleContext();

  return (
    <div className="space-y-6">
      <BusinessPageHeader
        title="General Information"
        description="Update your core business details used across Busal OS."
      />
      <BusinessGeneralForm business={business} />
    </div>
  );
}

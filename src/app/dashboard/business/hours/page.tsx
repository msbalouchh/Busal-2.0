import type { Metadata } from "next";

import { BusinessHoursEditor } from "@/modules/business/components/business-hours-editor";
import { BusinessPageHeader } from "@/modules/business/components/business-page-header";
import { getBusinessModuleContext } from "@/modules/business/lib/get-business-context";

export const metadata: Metadata = {
  title: "Business Hours",
};

export default async function BusinessHoursPage() {
  const { hours } = await getBusinessModuleContext();

  return (
    <div className="space-y-6">
      <BusinessPageHeader
        title="Business Hours"
        description="Set your weekly operating schedule."
      />
      <BusinessHoursEditor hours={hours} />
    </div>
  );
}

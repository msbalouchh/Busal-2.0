import type { Metadata } from "next";

import { BusinessHoursEditor } from "@/modules/business/components/business-hours-editor";
import { BusinessPageHeader } from "@/modules/business/components/business-page-header";
import { getBusinessProfileContext } from "@/modules/business/lib/get-business-profile-context";

export const metadata: Metadata = {
  title: "Working Hours",
};

export default async function BusinessHoursPage() {
  const { profile } = await getBusinessProfileContext();

  return (
    <div className="space-y-6">
      <BusinessPageHeader
        title="Working Hours"
        description="Set the default opening hours used across your business."
      />
      <BusinessHoursEditor hours={profile.hours} />
    </div>
  );
}

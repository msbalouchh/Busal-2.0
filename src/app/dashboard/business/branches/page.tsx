import type { Metadata } from "next";

import { BusinessBranchesPanel } from "@/modules/business/components/business-branches-panel";
import { BusinessPageHeader } from "@/modules/business/components/business-page-header";
import { getBusinessProfileContext } from "@/modules/business/lib/get-business-profile-context";

export const metadata: Metadata = {
  title: "Branch Management",
};

export default async function BusinessBranchesPage() {
  const { profile } = await getBusinessProfileContext();

  return (
    <div className="space-y-6">
      <BusinessPageHeader
        title="Branch Management"
        description="Create, edit, disable, and set the default branch for your business."
      />
      <BusinessBranchesPanel profile={profile} />
    </div>
  );
}

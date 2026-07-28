import type { Metadata } from "next";

import { BranchesManager } from "@/modules/business/components/branches-manager";
import { BusinessPageHeader } from "@/modules/business/components/business-page-header";
import { getBusinessModuleContext } from "@/modules/business/lib/get-business-context";

export const metadata: Metadata = {
  title: "Branches",
};

export default async function BusinessBranchesPage() {
  const { branches } = await getBusinessModuleContext();

  return (
    <div className="space-y-6">
      <BusinessPageHeader
        title="Branches"
        description="Manage your business locations. A main branch is created automatically if none exists."
      />
      <BranchesManager branches={branches} />
    </div>
  );
}

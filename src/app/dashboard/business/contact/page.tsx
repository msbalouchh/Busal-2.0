import type { Metadata } from "next";

import { ContactsManager } from "@/modules/business/components/contacts-manager";
import { BusinessPageHeader } from "@/modules/business/components/business-page-header";
import { getBusinessModuleContext } from "@/modules/business/lib/get-business-context";

export const metadata: Metadata = {
  title: "Contact",
};

export default async function BusinessContactPage() {
  const { contacts } = await getBusinessModuleContext();

  return (
    <div className="space-y-6">
      <BusinessPageHeader
        title="Contact"
        description="Manage phone numbers, emails, websites, and other contact details."
      />
      <ContactsManager contacts={contacts} />
    </div>
  );
}

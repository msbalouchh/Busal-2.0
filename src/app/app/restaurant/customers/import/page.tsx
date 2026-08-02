import type { Metadata } from "next";
import { Upload } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { CustomerImportPanel } from "@/modules/customer-crm-management/components/customer-import-panel";
import { CUSTOMER_CRM_ROUTES } from "@/modules/customer-crm-management/constants/routes";
import { getCustomerImportContext } from "@/modules/customer-crm-management/lib/get-customer-crm-context";
import { RESTAURANT_MANAGEMENT_ROUTES } from "@/modules/restaurant-management/constants/routes";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Import Customers" };
}

export default async function ImportCustomersPage() {
  const context = await getCustomerImportContext();

  return (
    <ApplicationPageTemplate
      title="Import customers"
      description="Bulk import customers from CSV."
      icon={Upload}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Restaurant", href: RESTAURANT_MANAGEMENT_ROUTES.dashboard },
        { label: "Customers", href: CUSTOMER_CRM_ROUTES.dashboard() },
        { label: "Import" },
      ]}
    >
      <CustomerImportPanel canExport={context.permissionsFlags.canExport} />
    </ApplicationPageTemplate>
  );
}

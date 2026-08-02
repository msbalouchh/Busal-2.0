import type { Metadata } from "next";
import { UserPlus } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { CreateCustomerForm } from "@/modules/customer-crm-management/components/create-customer-form";
import { CUSTOMER_CRM_ROUTES } from "@/modules/customer-crm-management/constants/routes";
import { getCustomerCrmContext } from "@/modules/customer-crm-management/lib/get-customer-crm-context";
import { RESTAURANT_MANAGEMENT_ROUTES } from "@/modules/restaurant-management/constants/routes";
import { redirect } from "next/navigation";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "New Customer" };
}

export default async function NewCustomerPage() {
  const context = await getCustomerCrmContext();

  if (!context.permissionsFlags.canCreate) {
    redirect(CUSTOMER_CRM_ROUTES.dashboard());
  }

  return (
    <ApplicationPageTemplate
      title="Register customer"
      description="Add a new customer to your CRM."
      icon={UserPlus}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Restaurant", href: RESTAURANT_MANAGEMENT_ROUTES.dashboard },
        { label: "Customers", href: CUSTOMER_CRM_ROUTES.dashboard() },
        { label: "New" },
      ]}
    >
      <CreateCustomerForm disabled={!context.permissionsFlags.canCreate} />
    </ApplicationPageTemplate>
  );
}

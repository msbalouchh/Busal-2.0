import type { Metadata } from "next";
import { Pencil } from "lucide-react";
import { redirect } from "next/navigation";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { EditCustomerForm } from "@/modules/customer-crm-management/components/edit-customer-form";
import { CUSTOMER_CRM_ROUTES } from "@/modules/customer-crm-management/constants/routes";
import { getCustomerProfileContext } from "@/modules/customer-crm-management/lib/get-customer-crm-context";
import { RESTAURANT_MANAGEMENT_ROUTES } from "@/modules/restaurant-management/constants/routes";

interface EditCustomerPageProps {
  params: Promise<{ customerId: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Edit Customer" };
}

export default async function EditCustomerPage({ params }: EditCustomerPageProps) {
  const { customerId } = await params;
  const context = await getCustomerProfileContext(customerId);

  if (!context.permissionsFlags.canUpdate) {
    redirect(CUSTOMER_CRM_ROUTES.profile(customerId));
  }

  return (
    <ApplicationPageTemplate
      title="Edit customer"
      description="Update customer profile details."
      icon={Pencil}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Restaurant", href: RESTAURANT_MANAGEMENT_ROUTES.dashboard },
        { label: "Customers", href: CUSTOMER_CRM_ROUTES.dashboard() },
        { label: context.profile.customer.name, href: CUSTOMER_CRM_ROUTES.profile(customerId) },
        { label: "Edit" },
      ]}
    >
      <EditCustomerForm
        customer={context.profile.customer}
        disabled={!context.permissionsFlags.canUpdate}
      />
    </ApplicationPageTemplate>
  );
}

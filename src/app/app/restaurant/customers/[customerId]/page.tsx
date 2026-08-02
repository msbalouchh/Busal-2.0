import type { Metadata } from "next";
import { User } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { CustomerProfilePanel } from "@/modules/customer-crm-management/components/customer-profile-panel";
import { CUSTOMER_CRM_ROUTES } from "@/modules/customer-crm-management/constants/routes";
import { getCustomerProfileContext } from "@/modules/customer-crm-management/lib/get-customer-crm-context";
import { RESTAURANT_MANAGEMENT_ROUTES } from "@/modules/restaurant-management/constants/routes";

interface CustomerProfilePageProps {
  params: Promise<{ customerId: string }>;
}

export async function generateMetadata({ params }: CustomerProfilePageProps): Promise<Metadata> {
  const { customerId } = await params;
  return { title: `Customer ${customerId}` };
}

export default async function CustomerProfilePage({ params }: CustomerProfilePageProps) {
  const { customerId } = await params;
  const context = await getCustomerProfileContext(customerId);

  return (
    <ApplicationPageTemplate
      title={context.profile.customer.name}
      description="Customer profile, timeline, and history."
      icon={User}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Restaurant", href: RESTAURANT_MANAGEMENT_ROUTES.dashboard },
        { label: "Customers", href: CUSTOMER_CRM_ROUTES.dashboard() },
        { label: context.profile.customer.name },
      ]}
    >
      <CustomerProfilePanel profile={context.profile} permissionsFlags={context.permissionsFlags} />
    </ApplicationPageTemplate>
  );
}

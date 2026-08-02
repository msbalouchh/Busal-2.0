import type { Metadata } from "next";
import { Gift } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { LoyaltyDashboardPanel } from "@/modules/customer-crm-management/components/loyalty-dashboard-panel";
import { CUSTOMER_CRM_ROUTES } from "@/modules/customer-crm-management/constants/routes";
import { getCustomerLoyaltyContext } from "@/modules/customer-crm-management/lib/get-customer-crm-context";
import { RESTAURANT_MANAGEMENT_ROUTES } from "@/modules/restaurant-management/constants/routes";

interface CustomerLoyaltyPageProps {
  params: Promise<{ customerId: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Customer Loyalty" };
}

export default async function CustomerLoyaltyPage({ params }: CustomerLoyaltyPageProps) {
  const { customerId } = await params;
  const context = await getCustomerLoyaltyContext(customerId);

  return (
    <ApplicationPageTemplate
      title="Loyalty dashboard"
      description="Membership tier, points balance, and transaction history."
      icon={Gift}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Restaurant", href: RESTAURANT_MANAGEMENT_ROUTES.dashboard },
        { label: "Customers", href: CUSTOMER_CRM_ROUTES.dashboard() },
        { label: context.customer.name, href: CUSTOMER_CRM_ROUTES.profile(customerId) },
        { label: "Loyalty" },
      ]}
    >
      <LoyaltyDashboardPanel
        customer={context.customer}
        loyaltyTransactions={context.loyaltyTransactions}
        permissionsFlags={context.permissionsFlags}
      />
    </ApplicationPageTemplate>
  );
}

import type { Metadata } from "next";
import { Users } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { CustomerDashboardPanel } from "@/modules/customer-crm-management/components/customer-dashboard-panel";
import { getCustomerDashboardContext } from "@/modules/customer-crm-management/lib/get-customer-crm-context";
import { RESTAURANT_MANAGEMENT_ROUTES } from "@/modules/restaurant-management/constants/routes";
import type { CustomerStatus } from "@prisma/client";

interface CustomersPageProps {
  searchParams: Promise<{ search?: string; status?: string; page?: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Customers" };
}

export default async function CustomersPage({ searchParams }: CustomersPageProps) {
  const params = await searchParams;
  const context = await getCustomerDashboardContext(
    params.search,
    (params.status as CustomerStatus | "ALL") ?? "ALL",
    params.page ? Number(params.page) : 1,
  );

  return (
    <ApplicationPageTemplate
      title="Customer CRM"
      description="Central customer database, profiles, loyalty, and order history."
      icon={Users}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Restaurant", href: RESTAURANT_MANAGEMENT_ROUTES.dashboard },
        { label: "Customers" },
      ]}
    >
      <CustomerDashboardPanel
        context={context}
        list={context.list}
        stats={context.stats}
        initialSearch={params.search ?? ""}
        initialStatus={params.status ?? "ALL"}
      />
    </ApplicationPageTemplate>
  );
}

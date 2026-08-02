import type { Metadata } from "next";
import { CreditCard } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { PaymentDashboardPanel } from "@/modules/payment-receipt-management/components/payment-dashboard-panel";
import { getPaymentDashboardContext } from "@/modules/payment-receipt-management/lib/get-payment-receipt-context";
import { RESTAURANT_MANAGEMENT_ROUTES } from "@/modules/restaurant-management/constants/routes";
import type { OrderPaymentStatus } from "@prisma/client";

interface PaymentsPageProps {
  searchParams: Promise<{ branchId?: string; search?: string; status?: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Payments" };
}

export default async function PaymentsPage({ searchParams }: PaymentsPageProps) {
  const params = await searchParams;
  const context = await getPaymentDashboardContext(
    params.branchId ?? "",
    params.search,
    (params.status as OrderPaymentStatus | "ALL") ?? "ALL",
  );

  return (
    <ApplicationPageTemplate
      title="Payments & Receipts"
      description="Take payments, split bills, issue receipts, and manage refunds."
      icon={CreditCard}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Restaurant", href: RESTAURANT_MANAGEMENT_ROUTES.dashboard },
        { label: "Payments" },
      ]}
    >
      <PaymentDashboardPanel
        context={context}
        payments={context.payments}
        stats={context.stats}
        unpaidOrders={context.unpaidOrders}
        initialSearch={params.search ?? ""}
        initialStatus={params.status ?? "ALL"}
      />
    </ApplicationPageTemplate>
  );
}

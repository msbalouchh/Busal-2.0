import type { Metadata } from "next";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { PaymentDetailsPanel } from "@/modules/payment-receipt-management/components/payment-details-panel";
import { getPaymentDetailsContext } from "@/modules/payment-receipt-management/lib/get-payment-receipt-context";
import { RESTAURANT_MANAGEMENT_ROUTES } from "@/modules/restaurant-management/constants/routes";
import { CreditCard } from "lucide-react";

interface PaymentDetailsPageProps {
  params: Promise<{ paymentId: string }>;
  searchParams: Promise<{ branchId?: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Payment Details" };
}

export default async function PaymentDetailsPage({
  params,
  searchParams,
}: PaymentDetailsPageProps) {
  const { paymentId } = await params;
  const query = await searchParams;
  const context = await getPaymentDetailsContext(query.branchId ?? "", paymentId);

  return (
    <ApplicationPageTemplate
      title="Payment Details"
      description="Review payment transactions and receipt delivery."
      icon={CreditCard}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Restaurant", href: RESTAURANT_MANAGEMENT_ROUTES.dashboard },
        { label: "Payments", href: "/app/restaurant/payments" },
        { label: context.payment.paymentNumber },
      ]}
    >
      <PaymentDetailsPanel
        branchId={context.selectedBranchId!}
        payment={context.payment}
        permissions={context.permissionsFlags}
      />
    </ApplicationPageTemplate>
  );
}

import {
  PaymentProvidersList,
  RevenuePaymentsList,
} from "@/modules/revops/components/revops-lists";
import { getRevopsPaymentsContext } from "@/modules/revops/lib/get-revops-context";

export default async function RevopsPaymentsPage() {
  const { payments } = await getRevopsPaymentsContext();

  return (
    <div className="space-y-6">
      <RevenuePaymentsList payments={payments} />
      <PaymentProvidersList />
    </div>
  );
}

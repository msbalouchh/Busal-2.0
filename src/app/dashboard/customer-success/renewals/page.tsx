import { CustomerRenewalsList } from "@/modules/customer-success/components/customer-success-lists";
import { getCustomerRenewalsContext } from "@/modules/customer-success/lib/get-customer-success-context";

export default async function CustomerRenewalsPage() {
  const { renewals } = await getCustomerRenewalsContext();

  return <CustomerRenewalsList renewals={renewals} />;
}

import { RevenueInvoicesList } from "@/modules/revops/components/revops-lists";
import { getRevopsInvoicesContext } from "@/modules/revops/lib/get-revops-context";

export default async function RevopsInvoicesPage() {
  const { invoices } = await getRevopsInvoicesContext();

  return <RevenueInvoicesList invoices={invoices} />;
}

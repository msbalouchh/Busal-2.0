import { SalesContactsList } from "@/modules/sales-crm/components/sales-crm-lists";
import { getSalesContactsContext } from "@/modules/sales-crm/lib/get-sales-crm-context";

export default async function SalesContactsPage() {
  const { contacts } = await getSalesContactsContext();

  return <SalesContactsList contacts={contacts} />;
}

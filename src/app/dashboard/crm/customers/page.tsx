import { CustomersManager } from "@/modules/crm/components/customers-manager";
import { getCrmCustomersContext } from "@/modules/crm/lib/get-crm-context";

export default async function CrmCustomersPage() {
  const data = await getCrmCustomersContext();

  return <CustomersManager customers={data.customers} groups={data.groups} />;
}

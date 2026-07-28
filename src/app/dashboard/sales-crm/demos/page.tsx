import { SalesDemosList } from "@/modules/sales-crm/components/sales-crm-lists";
import { getSalesDemosContext } from "@/modules/sales-crm/lib/get-sales-crm-context";

export default async function SalesDemosPage() {
  const { demos } = await getSalesDemosContext();

  return <SalesDemosList demos={demos} />;
}

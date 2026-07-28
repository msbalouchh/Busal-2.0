import { SuppliersManager } from "@/modules/inventory/components/suppliers-manager";
import { getInventorySuppliersContext } from "@/modules/inventory/lib/get-inventory-context";

export default async function InventorySuppliersPage() {
  const data = await getInventorySuppliersContext();

  return <SuppliersManager suppliers={data.suppliers} />;
}

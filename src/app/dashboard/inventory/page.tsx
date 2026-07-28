import { InventoryDashboard } from "@/modules/inventory/components/inventory-dashboard";
import { getInventoryOverviewContext } from "@/modules/inventory/lib/get-inventory-context";

export default async function InventoryOverviewPage() {
  const data = await getInventoryOverviewContext();

  return <InventoryDashboard dashboard={data.dashboard} />;
}

import type { Metadata } from "next";
import { Package } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { InventoryDashboardPanel } from "@/modules/inventory-supplier-management/components/inventory-dashboard-panel";
import { getInventoryDashboardContext } from "@/modules/inventory-supplier-management/lib/get-inventory-supplier-context";
import { RESTAURANT_MANAGEMENT_ROUTES } from "@/modules/restaurant-management/constants/routes";
import type { InventoryStatus } from "@prisma/client";

interface InventoryPageProps {
  searchParams: Promise<{
    branchId?: string;
    search?: string;
    status?: string;
    sortBy?: string;
    page?: string;
  }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Inventory" };
}

export default async function InventoryPage({ searchParams }: InventoryPageProps) {
  const params = await searchParams;
  const context = await getInventoryDashboardContext(
    params.branchId ?? "",
    params.search,
    (params.status as InventoryStatus | "ALL") ?? "ALL",
    (params.sortBy as "name" | "sku" | "currentStock" | "updatedAt") ?? "name",
    undefined,
    params.page ? Number(params.page) : 1,
  );

  return (
    <ApplicationPageTemplate
      title="Inventory"
      description="Manage stock items, suppliers, purchase orders, and adjustments."
      icon={Package}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Restaurant", href: RESTAURANT_MANAGEMENT_ROUTES.dashboard },
        { label: "Inventory" },
      ]}
    >
      <InventoryDashboardPanel
        context={context}
        list={context.list}
        stats={context.stats}
        lowStockItems={context.lowStockItems}
        initialSearch={params.search ?? ""}
        initialStatus={params.status ?? "ALL"}
        initialSortBy={params.sortBy ?? "name"}
      />
    </ApplicationPageTemplate>
  );
}

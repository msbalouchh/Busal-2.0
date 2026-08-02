import type { Metadata } from "next";
import { Truck } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { SupplierListPanel } from "@/modules/inventory-supplier-management/components/supplier-list-panel";
import { INVENTORY_SUPPLIER_ROUTES } from "@/modules/inventory-supplier-management/constants/routes";
import { getSupplierListContext } from "@/modules/inventory-supplier-management/lib/get-inventory-supplier-context";
import { RESTAURANT_MANAGEMENT_ROUTES } from "@/modules/restaurant-management/constants/routes";

interface SuppliersPageProps {
  searchParams: Promise<{ search?: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Suppliers" };
}

export default async function SuppliersPage({ searchParams }: SuppliersPageProps) {
  const params = await searchParams;
  const context = await getSupplierListContext({ search: params.search });

  return (
    <ApplicationPageTemplate
      title="Suppliers"
      description="Manage vendor contacts and purchase relationships."
      icon={Truck}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Restaurant", href: RESTAURANT_MANAGEMENT_ROUTES.dashboard },
        { label: "Inventory", href: INVENTORY_SUPPLIER_ROUTES.dashboard() },
        { label: "Suppliers" },
      ]}
    >
      <SupplierListPanel
        context={context}
        list={context.list}
        initialSearch={params.search ?? ""}
      />
    </ApplicationPageTemplate>
  );
}

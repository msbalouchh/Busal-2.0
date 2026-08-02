import type { Metadata } from "next";
import { Truck } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { SupplierDetailsPanel } from "@/modules/inventory-supplier-management/components/supplier-details-panel";
import { INVENTORY_SUPPLIER_ROUTES } from "@/modules/inventory-supplier-management/constants/routes";
import { getSupplierDetailsContext } from "@/modules/inventory-supplier-management/lib/get-inventory-supplier-context";
import { RESTAURANT_MANAGEMENT_ROUTES } from "@/modules/restaurant-management/constants/routes";

interface SupplierDetailsPageProps {
  params: Promise<{ supplierId: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Supplier" };
}

export default async function SupplierDetailsPage({ params }: SupplierDetailsPageProps) {
  const { supplierId } = await params;
  const context = await getSupplierDetailsContext(supplierId);

  return (
    <ApplicationPageTemplate
      title={context.supplier.name}
      description="Supplier profile and purchase order history."
      icon={Truck}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Restaurant", href: RESTAURANT_MANAGEMENT_ROUTES.dashboard },
        { label: "Inventory", href: INVENTORY_SUPPLIER_ROUTES.dashboard() },
        { label: "Suppliers", href: INVENTORY_SUPPLIER_ROUTES.suppliers() },
        { label: context.supplier.name },
      ]}
    >
      <SupplierDetailsPanel supplier={context.supplier} purchaseOrders={context.purchaseOrders} />
    </ApplicationPageTemplate>
  );
}

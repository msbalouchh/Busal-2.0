import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { redirect } from "next/navigation";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { CreateSupplierForm } from "@/modules/inventory-supplier-management/components/create-supplier-form";
import { INVENTORY_SUPPLIER_ROUTES } from "@/modules/inventory-supplier-management/constants/routes";
import { getInventorySupplierContext } from "@/modules/inventory-supplier-management/lib/get-inventory-supplier-context";
import { RESTAURANT_MANAGEMENT_ROUTES } from "@/modules/restaurant-management/constants/routes";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "New Supplier" };
}

export default async function NewSupplierPage() {
  const context = await getInventorySupplierContext();
  if (!context.permissionsFlags.canCreateSupplier) {
    redirect(INVENTORY_SUPPLIER_ROUTES.suppliers());
  }

  return (
    <ApplicationPageTemplate
      title="Create supplier"
      description="Add a new supplier to your business."
      icon={Plus}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Restaurant", href: RESTAURANT_MANAGEMENT_ROUTES.dashboard },
        { label: "Inventory", href: INVENTORY_SUPPLIER_ROUTES.dashboard() },
        { label: "Suppliers", href: INVENTORY_SUPPLIER_ROUTES.suppliers() },
        { label: "New" },
      ]}
    >
      <CreateSupplierForm />
    </ApplicationPageTemplate>
  );
}

import type { Metadata } from "next";

import { InventoryNav } from "@/modules/inventory/components/inventory-nav";

export const metadata: Metadata = {
  title: "Inventory",
};

export default function InventoryLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Inventory</h1>
        <p className="text-muted-foreground text-sm">
          Manage ingredients, recipes, stock levels, and suppliers.
        </p>
      </div>
      <InventoryNav />
      {children}
    </div>
  );
}

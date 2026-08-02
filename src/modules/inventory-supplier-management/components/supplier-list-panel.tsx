"use client";

import Link from "next/link";
import { Loader2, Plus, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { INVENTORY_SUPPLIER_ROUTES } from "@/modules/inventory-supplier-management/constants/routes";
import type { InventorySupplierContext } from "@/modules/inventory-supplier-management/lib/get-inventory-supplier-context";
import type { SupplierListResult } from "@/modules/inventory-supplier-management/types/inventory-supplier-types";

interface SupplierListPanelProps {
  context: InventorySupplierContext;
  list: SupplierListResult;
  initialSearch?: string;
}

export function SupplierListPanel({ context, list, initialSearch = "" }: SupplierListPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(initialSearch);

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    startTransition(() => {
      router.push(`${INVENTORY_SUPPLIER_ROUTES.suppliers()}?${params.toString()}`);
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="text-muted-foreground absolute top-3 left-3 h-4 w-4" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search suppliers"
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={applyFilters} disabled={isPending}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Search
          </Button>
          {context.permissionsFlags.canCreateSupplier ? (
            <Button asChild>
              <Link href={INVENTORY_SUPPLIER_ROUTES.createSupplier()}>
                <Plus className="mr-2 h-4 w-4" />
                Add supplier
              </Link>
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {list.items.map((supplier) => (
          <Link key={supplier.id} href={INVENTORY_SUPPLIER_ROUTES.supplier(supplier.id)}>
            <Card className="h-full rounded-xl shadow-sm transition-shadow hover:shadow-md">
              <CardHeader>
                <CardTitle className="text-base">{supplier.name}</CardTitle>
                <p className="text-muted-foreground text-sm">
                  {supplier.contactPerson ?? supplier.email ?? "No contact"}
                </p>
              </CardHeader>
              <CardContent className="text-sm">
                <p>{supplier.purchaseOrderCount} purchase orders</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

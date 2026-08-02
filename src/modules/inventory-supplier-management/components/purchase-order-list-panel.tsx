"use client";

import Link from "next/link";
import { Loader2, Plus, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BranchSelector } from "@/modules/branch-management/components/branch-selector";
import { PurchaseOrderStatusBadge } from "@/modules/inventory-supplier-management/components/purchase-order-status-badge";
import {
  INVENTORY_SUPPLIER_ROUTES,
  PURCHASE_ORDER_STATUS_FILTER_OPTIONS,
} from "@/modules/inventory-supplier-management/constants/routes";
import type { InventorySupplierContext } from "@/modules/inventory-supplier-management/lib/get-inventory-supplier-context";
import type { PurchaseOrderListResult } from "@/modules/inventory-supplier-management/types/inventory-supplier-types";

interface PurchaseOrderListPanelProps {
  context: InventorySupplierContext;
  list: PurchaseOrderListResult;
  initialSearch?: string;
  initialStatus?: string;
}

export function PurchaseOrderListPanel({
  context,
  list,
  initialSearch = "",
  initialStatus = "ALL",
}: PurchaseOrderListPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(initialSearch);
  const [status, setStatus] = useState(initialStatus);
  const branchId = context.selectedBranchId;

  const applyFilters = () => {
    if (!branchId) return;
    const params = new URLSearchParams({ branchId });
    if (search.trim()) params.set("search", search.trim());
    if (status !== "ALL") params.set("status", status);
    startTransition(() => {
      router.push(`${INVENTORY_SUPPLIER_ROUTES.purchaseOrders()}?${params.toString()}`);
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-xs space-y-2">
          <p className="text-sm font-medium">Branch</p>
          <BranchSelector
            branches={context.branches}
            value={branchId ?? undefined}
            onValueChange={(nextBranchId) => {
              startTransition(() => {
                router.push(INVENTORY_SUPPLIER_ROUTES.purchaseOrders(nextBranchId));
              });
            }}
            placeholder="Select branch"
          />
        </div>
        {branchId && context.permissionsFlags.canCreatePurchaseOrder ? (
          <Button asChild>
            <Link href={INVENTORY_SUPPLIER_ROUTES.createPurchaseOrder(branchId)}>
              <Plus className="mr-2 h-4 w-4" />
              Create PO
            </Link>
          </Button>
        ) : null}
      </div>

      {branchId ? (
        <>
          <div className="grid gap-3 lg:grid-cols-4">
            <div className="relative lg:col-span-2">
              <Search className="text-muted-foreground absolute top-3 left-3 h-4 w-4" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search PO number"
                className="pl-9"
              />
            </div>
            <select
              className="border-input bg-background flex h-10 rounded-md border px-3 py-2 text-sm"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              {PURCHASE_ORDER_STATUS_FILTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <Button onClick={applyFilters} disabled={isPending}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Apply
            </Button>
          </div>

          <div className="space-y-3">
            {list.items.map((po) => (
              <Link key={po.id} href={INVENTORY_SUPPLIER_ROUTES.purchaseOrder(po.id, branchId)}>
                <Card className="rounded-xl shadow-sm transition-shadow hover:shadow-md">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-base">{po.purchaseOrderNumber}</CardTitle>
                      <p className="text-muted-foreground text-sm">{po.supplierName}</p>
                    </div>
                    <PurchaseOrderStatusBadge status={po.status} />
                  </CardHeader>
                  <CardContent className="text-sm">
                    £{po.totalAmount.toFixed(2)} · {po.items.length} items
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

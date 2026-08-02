"use client";

import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PurchaseOrderStatusBadge } from "@/modules/inventory-supplier-management/components/purchase-order-status-badge";
import { INVENTORY_SUPPLIER_ROUTES } from "@/modules/inventory-supplier-management/constants/routes";
import type {
  PurchaseOrderRecord,
  SupplierRecord,
} from "@/modules/inventory-supplier-management/types/inventory-supplier-types";

interface SupplierDetailsPanelProps {
  supplier: SupplierRecord;
  purchaseOrders: PurchaseOrderRecord[];
}

export function SupplierDetailsPanel({ supplier, purchaseOrders }: SupplierDetailsPanelProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">{supplier.name}</h2>
        <p className="text-muted-foreground text-sm">{supplier.status}</p>
      </div>

      <Card className="rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle>Supplier details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Detail label="Contact" value={supplier.contactPerson ?? "—"} />
          <Detail label="Email" value={supplier.email ?? "—"} />
          <Detail label="Phone" value={supplier.phone ?? "—"} />
          <Detail label="Website" value={supplier.website ?? "—"} />
          <Detail label="Address" value={supplier.address ?? "—"} />
          <Detail label="City" value={supplier.city ?? "—"} />
          <Detail label="Country" value={supplier.country ?? "—"} />
          <Detail label="Notes" value={supplier.notes ?? "—"} />
        </CardContent>
      </Card>

      <Card className="rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle>Purchase orders</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {purchaseOrders.length === 0 ? (
            <p className="text-muted-foreground text-sm">No purchase orders yet.</p>
          ) : (
            purchaseOrders.map((po) => (
              <Link
                key={po.id}
                href={INVENTORY_SUPPLIER_ROUTES.purchaseOrder(po.id, po.branchId)}
                className="flex items-center justify-between rounded-lg border p-3 hover:shadow-sm"
              >
                <div>
                  <p className="font-medium">{po.purchaseOrderNumber}</p>
                  <p className="text-muted-foreground text-sm">
                    £{po.totalAmount.toFixed(2)} · {new Date(po.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <PurchaseOrderStatusBadge status={po.status} />
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted-foreground text-sm">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

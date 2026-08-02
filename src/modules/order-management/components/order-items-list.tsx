import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderKitchenStatusBadge } from "@/modules/order-management/components/order-kitchen-status-badge";
import type { OrderItemRecord } from "@/modules/order-management/types/order-management-types";

interface OrderItemsListProps {
  items: OrderItemRecord[];
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "GBP" }).format(value);
}

export function OrderItemsList({ items }: OrderItemsListProps) {
  if (items.length === 0) {
    return <p className="text-muted-foreground text-sm">No items on this order.</p>;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <Card key={item.id} className="rounded-xl shadow-sm">
          <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
            <div>
              <CardTitle className="text-base">{item.productNameSnapshot}</CardTitle>
              <p className="text-muted-foreground text-sm">
                {item.quantity} × {formatCurrency(item.unitPrice)}
              </p>
            </div>
            <OrderKitchenStatusBadge status={item.status} />
          </CardHeader>
          <CardContent className="space-y-2">
            {item.modifiers.length > 0 ? (
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs tracking-wide uppercase">Modifiers</p>
                <ul className="space-y-1 text-sm">
                  {item.modifiers.map((modifier) => (
                    <li key={modifier.id} className="flex justify-between gap-4">
                      <span>{modifier.nameSnapshot}</span>
                      <span>
                        {modifier.priceAdjustment >= 0 ? "+" : ""}
                        {formatCurrency(modifier.priceAdjustment)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {item.specialInstructions ? (
              <p className="text-muted-foreground text-sm italic">{item.specialInstructions}</p>
            ) : null}
            <div className="flex justify-between border-t pt-2 text-sm font-medium">
              <span>Line total</span>
              <span>{formatCurrency(item.totalAmount)}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

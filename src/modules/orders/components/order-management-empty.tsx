import { ShoppingBag } from "lucide-react";

import { Button } from "@/components/ui/button";

interface OrderManagementEmptyProps {
  onCreate?: () => void;
}

export function OrderManagementEmpty({ onCreate }: OrderManagementEmptyProps) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-lg border p-6 text-center">
      <ShoppingBag className="text-muted-foreground h-8 w-8" />
      <div>
        <p className="font-medium">No orders yet</p>
        <p className="text-muted-foreground text-sm">
          Orders from dine-in, takeaway, delivery, and QR will appear here.
        </p>
      </div>
      {onCreate ? (
        <Button type="button" onClick={onCreate}>
          Create order
        </Button>
      ) : null}
    </div>
  );
}

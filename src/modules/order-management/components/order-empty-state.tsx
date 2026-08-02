import { ClipboardList } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ORDER_MANAGEMENT_ROUTES } from "@/modules/order-management/constants/routes";

interface OrderEmptyStateProps {
  branchId?: string;
  canCreate?: boolean;
}

export function OrderEmptyState({ branchId, canCreate = false }: OrderEmptyStateProps) {
  return (
    <Card className="rounded-xl border-dashed shadow-sm">
      <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <ClipboardList className="text-muted-foreground h-10 w-10" aria-hidden="true" />
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">No orders yet</h3>
          <p className="text-muted-foreground max-w-md text-sm">
            Create dine-in, takeaway, or delivery orders to start tracking kitchen workflow and
            totals.
          </p>
        </div>
        {branchId && canCreate ? (
          <Button asChild>
            <Link href={ORDER_MANAGEMENT_ROUTES.create(branchId)}>Create order</Link>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

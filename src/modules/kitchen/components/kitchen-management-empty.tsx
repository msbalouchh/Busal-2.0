import { ChefHat } from "lucide-react";

export function KitchenManagementEmpty() {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
      <ChefHat className="text-muted-foreground mb-3 h-8 w-8" />
      <h3 className="text-sm font-medium">No active kitchen orders</h3>
      <p className="text-muted-foreground mt-1 max-w-sm text-sm">
        Orders from POS and OMS will appear here when they are sent to the kitchen queue.
      </p>
    </div>
  );
}

import { ShoppingCart } from "lucide-react";

export function PosManagementEmpty() {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
      <ShoppingCart className="text-muted-foreground mb-3 h-8 w-8" />
      <h3 className="text-sm font-medium">No POS transactions</h3>
      <p className="text-muted-foreground mt-1 max-w-sm text-sm">
        Start a new sale from the terminal or create a transaction to see it here.
      </p>
    </div>
  );
}

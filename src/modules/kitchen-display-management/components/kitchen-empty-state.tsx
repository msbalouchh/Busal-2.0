import { ChefHat } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

export function KitchenEmptyState() {
  return (
    <Card className="rounded-xl border-dashed shadow-sm">
      <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <ChefHat className="text-muted-foreground h-10 w-10" aria-hidden="true" />
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">Kitchen queue is clear</h3>
          <p className="text-muted-foreground max-w-md text-sm">
            New orders from Order Management will appear here in real time.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

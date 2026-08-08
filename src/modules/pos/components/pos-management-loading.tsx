import { Loader2 } from "lucide-react";

export function PosManagementLoading() {
  return (
    <div className="flex min-h-48 items-center justify-center rounded-lg border">
      <div className="text-muted-foreground flex items-center gap-2 text-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading POS data...
      </div>
    </div>
  );
}

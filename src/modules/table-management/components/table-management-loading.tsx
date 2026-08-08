import { Loader2 } from "lucide-react";

export function TableManagementLoading({ label = "Loading tables…" }: { label?: string }) {
  return (
    <div className="text-muted-foreground flex items-center gap-2 py-8 text-sm" role="status">
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      {label}
    </div>
  );
}

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-800",
  INACTIVE: "bg-slate-100 text-slate-700",
  DRAFT: "bg-amber-100 text-amber-800",
  SCHEDULED: "bg-blue-100 text-blue-800",
  DEPRECATED: "bg-slate-200 text-slate-600",
  ARCHIVED: "bg-slate-200 text-slate-600",
  IN_PROGRESS: "bg-indigo-100 text-indigo-800",
  COMPLETED: "bg-emerald-100 text-emerald-800",
  ROLLED_BACK: "bg-rose-100 text-rose-800",
  FAILED: "bg-rose-100 text-rose-800",
  NONE: "bg-emerald-100 text-emerald-800",
  READ_ONLY: "bg-amber-100 text-amber-800",
  FULL_LOCK: "bg-rose-100 text-rose-800",
  healthy: "bg-emerald-100 text-emerald-800",
  degraded: "bg-amber-100 text-amber-800",
  down: "bg-rose-100 text-rose-800",
};

interface PlatformAdminStatusBadgeProps {
  status: string;
  label?: string;
  className?: string;
}

export function PlatformAdminStatusBadge({
  status,
  label,
  className,
}: PlatformAdminStatusBadgeProps) {
  const style = STATUS_STYLES[status] ?? "bg-muted text-muted-foreground";

  return (
    <Badge variant="outline" className={cn("border-transparent font-medium", style, className)}>
      {label ?? status.replace(/_/g, " ")}
    </Badge>
  );
}

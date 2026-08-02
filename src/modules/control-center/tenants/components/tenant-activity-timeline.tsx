import { cn } from "@/lib/utils";
import type { TenantActivityView } from "@/modules/tenant-platform/types/tenant-platform-types";

interface TenantActivityTimelineProps {
  items: TenantActivityView[];
  emptyMessage?: string;
  className?: string;
}

function formatTimestamp(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function TenantActivityTimeline({
  items,
  emptyMessage = "No tenant activity recorded yet.",
  className,
}: TenantActivityTimelineProps) {
  if (items.length === 0) {
    return <p className="text-muted-foreground text-sm">{emptyMessage}</p>;
  }

  return (
    <ol className={cn("space-y-4", className)} aria-label="Tenant activity timeline">
      {items.map((item) => (
        <li key={item.id} className="relative pl-6">
          <span
            className="bg-primary absolute top-2 left-0 h-2 w-2 rounded-full"
            aria-hidden="true"
          />
          <div className="space-y-1">
            <p className="text-sm font-medium">{item.title}</p>
            {item.description ? (
              <p className="text-muted-foreground text-xs">{item.description}</p>
            ) : null}
            <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
              <span className="bg-muted rounded px-1.5 py-0.5">{item.eventType}</span>
              <time dateTime={item.createdAt}>{formatTimestamp(item.createdAt)}</time>
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

import Link from "next/link";

import { cn } from "@/lib/utils";
import type { DashboardActivityItem } from "@/modules/dashboard/types/dashboard";

interface ActivityTimelineProps {
  items: DashboardActivityItem[];
  emptyMessage?: string;
  className?: string;
}

function formatTimestamp(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function ActivityTimeline({
  items,
  emptyMessage = "No recent activity yet.",
  className,
}: ActivityTimelineProps) {
  if (items.length === 0) {
    return <p className="text-muted-foreground text-sm">{emptyMessage}</p>;
  }

  return (
    <ol className={cn("space-y-4", className)} aria-label="Recent activity">
      {items.map((item) => (
        <li key={item.id} className="relative pl-6">
          <span
            className="bg-primary absolute top-2 left-0 h-2 w-2 rounded-full"
            aria-hidden="true"
          />
          <div className="space-y-1">
            {item.href ? (
              <Link href={item.href} className="text-sm font-medium hover:underline">
                {item.title}
              </Link>
            ) : (
              <p className="text-sm font-medium">{item.title}</p>
            )}
            {item.description ? (
              <p className="text-muted-foreground text-xs">{item.description}</p>
            ) : null}
            <time className="text-muted-foreground text-xs" dateTime={item.timestamp}>
              {formatTimestamp(item.timestamp)}
            </time>
          </div>
        </li>
      ))}
    </ol>
  );
}

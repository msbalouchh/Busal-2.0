"use client";

import type { CustomerTimelineEvent } from "@/modules/crm/types/customer";
import { cn } from "@/lib/utils";

interface CustomerTimelinePanelProps {
  events: CustomerTimelineEvent[];
  className?: string;
}

export function CustomerTimelinePanel({ events, className }: CustomerTimelinePanelProps) {
  if (events.length === 0) {
    return (
      <p className={cn("text-muted-foreground text-sm", className)} role="status">
        No timeline events yet.
      </p>
    );
  }

  return (
    <ol className={cn("space-y-3", className)} aria-label="Customer timeline">
      {events.map((event) => (
        <li
          key={event.id}
          className="border-border rounded-md border p-3 text-sm"
          aria-label={event.title}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium">{event.title}</span>
            <time className="text-muted-foreground text-xs" dateTime={event.occurredAt}>
              {new Date(event.occurredAt).toLocaleDateString("en-GB")}
            </time>
          </div>
          <p className="text-muted-foreground mt-1">{event.description}</p>
        </li>
      ))}
    </ol>
  );
}

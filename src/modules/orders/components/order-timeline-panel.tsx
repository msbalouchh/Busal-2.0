import { cn } from "@/lib/utils";
import type { OrderTimelineEvent } from "@/modules/orders/types/order";

interface OrderTimelinePanelProps {
  events: OrderTimelineEvent[];
  className?: string;
}

export function OrderTimelinePanel({ events, className }: OrderTimelinePanelProps) {
  if (events.length === 0) {
    return (
      <p className={cn("text-muted-foreground text-sm", className)}>No timeline events yet.</p>
    );
  }

  return (
    <ol className={cn("space-y-4", className)}>
      {events.map((event) => (
        <li key={event.id} className="border-border relative border-l pl-4">
          <span className="bg-primary absolute top-1.5 -left-1.5 h-2.5 w-2.5 rounded-full" />
          <p className="text-sm font-medium">{event.title}</p>
          <p className="text-muted-foreground mt-0.5 text-xs">{event.description}</p>
          <time className="text-muted-foreground mt-1 block text-xs">
            {new Date(event.occurredAt).toLocaleString("en-GB")}
          </time>
        </li>
      ))}
    </ol>
  );
}

import { CheckCircle2, Circle } from "lucide-react";

import { ORDER_TIMELINE_STEPS } from "@/modules/order-management/constants/routes";
import type { RestaurantOrderStatus } from "@prisma/client";

interface OrderTimelineViewProps {
  status: RestaurantOrderStatus;
  placedAt: string;
  completedAt: string | null;
  cancelledAt: string | null;
}

export function OrderTimelineView({
  status,
  placedAt,
  completedAt,
  cancelledAt,
}: OrderTimelineViewProps) {
  const isCancelled = status === "CANCELLED";
  const currentIndex = isCancelled
    ? -1
    : ORDER_TIMELINE_STEPS.indexOf(status as (typeof ORDER_TIMELINE_STEPS)[number]);

  return (
    <div className="space-y-4">
      {isCancelled ? (
        <p className="text-destructive text-sm font-medium">
          Cancelled {cancelledAt ? new Date(cancelledAt).toLocaleString() : ""}
        </p>
      ) : null}
      <ol className="space-y-3">
        {ORDER_TIMELINE_STEPS.map((step, index) => {
          const isComplete = currentIndex >= index;
          const isCurrent = currentIndex === index;

          return (
            <li key={step} className="flex items-center gap-3">
              {isComplete ? (
                <CheckCircle2 className="text-primary h-5 w-5 shrink-0" aria-hidden="true" />
              ) : (
                <Circle className="text-muted-foreground h-5 w-5 shrink-0" aria-hidden="true" />
              )}
              <div>
                <p className={`text-sm font-medium ${isCurrent ? "text-primary" : ""}`}>
                  {step.charAt(0) + step.slice(1).toLowerCase().replace("_", " ")}
                </p>
                {index === 0 ? (
                  <p className="text-muted-foreground text-xs">
                    Placed {new Date(placedAt).toLocaleString()}
                  </p>
                ) : null}
                {step === "COMPLETED" && completedAt ? (
                  <p className="text-muted-foreground text-xs">
                    {new Date(completedAt).toLocaleString()}
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

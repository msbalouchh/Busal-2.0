import type * as React from "react";

import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "bg-muted rounded-md motion-safe:animate-pulse motion-reduce:animate-none",
        className,
      )}
      aria-hidden="true"
      {...props}
    />
  );
}

export { Skeleton };

import * as React from "react";

import { cn } from "@/lib/utils";

export type DividerProps = React.HTMLAttributes<HTMLDivElement> & {
  orientation?: "horizontal" | "vertical";
  label?: string;
};

const Divider = React.forwardRef<HTMLDivElement, DividerProps>(
  ({ className, orientation = "horizontal", label, ...props }, ref) => {
    if (orientation === "vertical") {
      return (
        <div
          ref={ref}
          role="separator"
          aria-orientation="vertical"
          className={cn("bg-border w-px shrink-0 self-stretch", className)}
          {...props}
        />
      );
    }

    if (label) {
      return (
        <div
          ref={ref}
          role="separator"
          className={cn("flex w-full items-center gap-3", className)}
          {...props}
        >
          <span className="bg-border h-px flex-1 shrink-0" />
          <span className="text-muted-foreground text-xs font-medium">{label}</span>
          <span className="bg-border h-px flex-1 shrink-0" />
        </div>
      );
    }

    return (
      <div
        ref={ref}
        role="separator"
        aria-orientation="horizontal"
        className={cn("bg-border h-px w-full shrink-0", className)}
        {...props}
      />
    );
  },
);
Divider.displayName = "Divider";

export { Divider };

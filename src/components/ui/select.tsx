import { ChevronDown } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  error?: boolean;
};

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error = false, children, "aria-invalid": ariaInvalid, ...props }, ref) => {
    return (
      <div className="relative inline-flex w-full items-center">
        <select
          className={cn(
            "bg-background ring-offset-background flex h-9 w-full appearance-none rounded-md border py-1 pr-9 pl-3 text-sm shadow-sm transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
            error
              ? "border-error focus-visible:ring-error"
              : "border-input focus-visible:ring-ring",
            className,
          )}
          ref={ref}
          aria-invalid={ariaInvalid ?? (error || undefined)}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          className="text-muted-foreground pointer-events-none absolute right-3"
          size={16}
          aria-hidden="true"
        />
      </div>
    );
  },
);
Select.displayName = "Select";

export { Select };

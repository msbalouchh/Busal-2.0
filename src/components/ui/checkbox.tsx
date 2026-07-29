import { Check } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

export type CheckboxProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">;

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, disabled, checked, ...props }, ref) => {
    return (
      <span className="relative inline-flex shrink-0 items-center">
        <input
          type="checkbox"
          ref={ref}
          checked={checked}
          disabled={disabled}
          className={cn(
            "peer border-input bg-background ring-offset-background focus-visible:ring-ring h-4 w-4 shrink-0 cursor-pointer appearance-none rounded-[4px] border shadow-sm transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
            "peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground",
            className,
          )}
          {...props}
        />
        {checked ? (
          <Check
            className="text-primary-foreground pointer-events-none absolute top-0 left-0 h-4 w-4"
            aria-hidden="true"
          />
        ) : null}
      </span>
    );
  },
);
Checkbox.displayName = "Checkbox";

export { Checkbox };

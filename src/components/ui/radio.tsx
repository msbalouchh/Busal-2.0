import * as React from "react";

import { cn } from "@/lib/utils";

export type RadioProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">;

const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  ({ className, disabled, checked, ...props }, ref) => {
    return (
      <span className="relative inline-flex shrink-0 items-center">
        <input
          type="radio"
          ref={ref}
          checked={checked}
          disabled={disabled}
          className={cn(
            "peer border-input bg-background ring-offset-background focus-visible:ring-ring h-4 w-4 shrink-0 cursor-pointer appearance-none rounded-full border shadow-sm transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
            "peer-checked:border-primary",
            className,
          )}
          {...props}
        />
        {checked ? (
          <span
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
            aria-hidden="true"
          >
            <span className="bg-primary h-2 w-2 rounded-full" />
          </span>
        ) : null}
      </span>
    );
  },
);
Radio.displayName = "Radio";

export { Radio };

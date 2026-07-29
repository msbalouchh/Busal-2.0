import * as React from "react";

import { cn } from "@/lib/utils";

export type SwitchProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "size"> & {
  size?: "sm" | "md";
};

const trackSizes = {
  sm: { track: "h-5 w-9", thumb: "h-3.5 w-3.5", translate: "translate-x-4" },
  md: { track: "h-6 w-11", thumb: "h-5 w-5", translate: "translate-x-5" },
} as const;

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, disabled, checked, size = "md", "aria-label": ariaLabel, ...props }, ref) => {
    const s = trackSizes[size];
    return (
      <label
        className={cn("relative inline-flex items-center", disabled && "opacity-50", className)}
      >
        <input
          type="checkbox"
          role="switch"
          ref={ref}
          checked={checked}
          disabled={disabled}
          aria-label={ariaLabel}
          className="peer sr-only"
          {...props}
        />
        <span
          className={cn(
            "bg-input peer-checked:bg-primary peer-focus-visible:ring-ring cursor-pointer rounded-full p-0.5 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2 peer-focus-visible:outline-none peer-disabled:cursor-not-allowed",
            s.track,
          )}
        >
          <span
            className={cn(
              "bg-background block rounded-full shadow-sm transition-transform",
              s.thumb,
              checked && s.translate,
            )}
          />
        </span>
      </label>
    );
  },
);
Switch.displayName = "Switch";

export { Switch };

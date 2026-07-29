import * as React from "react";

import { cn } from "@/lib/utils";

const spinnerVariants = {
  size: {
    sm: "h-4 w-4 border-2",
    md: "h-6 w-6 border-2",
    lg: "h-8 w-8 border-[3px]",
  },
} as const;

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: keyof typeof spinnerVariants.size;
  label?: string;
}

function Spinner({ className, size = "md", label = "Loading", ...props }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "text-muted-foreground animate-spin rounded-full border-current border-t-transparent",
        spinnerVariants.size[size],
        className,
      )}
      {...props}
    >
      <span className="sr-only">{label}</span>
    </div>
  );
}

export { Spinner, spinnerVariants };

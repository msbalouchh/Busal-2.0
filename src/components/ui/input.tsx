import * as React from "react";

import { cn } from "@/lib/utils";

export type InputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> & {
  error?: boolean;
  size?: "default" | "sm" | "lg";
};

const inputSizes = {
  default: "h-9",
  sm: "h-8 text-xs",
  lg: "h-10 text-base",
} as const;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    { className, type, error = false, size = "default", "aria-invalid": ariaInvalid, ...props },
    ref,
  ) => {
    return (
      <input
        type={type}
        className={cn(
          "bg-background ring-offset-background placeholder:text-muted-foreground flex w-full rounded-md border px-3 py-1 text-sm shadow-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 motion-safe:transition-colors motion-safe:duration-150 motion-reduce:transition-none",
          inputSizes[size],
          error ? "border-error focus-visible:ring-error" : "border-input focus-visible:ring-ring",
          className,
        )}
        ref={ref}
        aria-invalid={ariaInvalid ?? (error || undefined)}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };

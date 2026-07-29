import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const gridVariants = cva("grid", {
  variants: {
    gap: {
      none: "gap-0",
      xs: "gap-1",
      sm: "gap-2",
      md: "gap-4",
      lg: "gap-6",
      xl: "gap-8",
    },
    flow: {
      row: "grid-flow-row",
      col: "grid-flow-col",
      dense: "grid-flow-row-dense",
    },
    cols: {
      1: "grid-cols-1",
      2: "grid-cols-2",
      3: "grid-cols-3",
      4: "grid-cols-4",
      6: "grid-cols-6",
      12: "grid-cols-12",
    },
    responsive: {
      true: "grid-cols-1 sm:grid-cols-2",
      false: "",
    },
  },
  defaultVariants: {
    gap: "md",
    flow: "row",
  },
});

export interface GridProps
  extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof gridVariants> {
  /** Responsive auto-fit columns: 1 col on mobile, scales to `cols` at md breakpoint. */
  autoFit?: boolean;
}

function Grid({ className, gap, flow, cols, responsive, autoFit, ...props }: GridProps) {
  const autoFitClass = autoFit ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "";

  return (
    <div
      className={cn(gridVariants({ gap, flow, cols, responsive }), autoFitClass, className)}
      {...props}
    />
  );
}

export { Grid, gridVariants };

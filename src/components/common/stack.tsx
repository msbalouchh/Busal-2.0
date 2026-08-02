import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type StackDirection = "vertical" | "horizontal";
type StackGap = "sm" | "md" | "lg" | "xl";

interface StackProps {
  direction?: StackDirection;
  gap?: StackGap;
  children: ReactNode;
  className?: string;
}

const gapClasses: Record<StackGap, string> = {
  sm: "gap-2",
  md: "gap-4",
  lg: "gap-6",
  xl: "gap-8",
};

export function Stack({ direction = "vertical", gap = "md", children, className }: StackProps) {
  return (
    <div
      className={cn(
        direction === "horizontal" ? "flex flex-row flex-wrap items-center" : "flex flex-col",
        gapClasses[gap],
        className,
      )}
    >
      {children}
    </div>
  );
}

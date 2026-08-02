import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type GridColumns = 2 | 3 | "auto-fit";

interface GridProps {
  columns?: GridColumns;
  children: ReactNode;
  className?: string;
}

const columnClasses: Record<Exclude<GridColumns, "auto-fit">, string> = {
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
};

export function Grid({ columns = 2, children, className }: GridProps) {
  return (
    <div
      className={cn(
        "grid gap-4",
        columns === "auto-fit"
          ? "grid-cols-[repeat(auto-fit,minmax(12rem,1fr))]"
          : columnClasses[columns],
        className,
      )}
    >
      {children}
    </div>
  );
}

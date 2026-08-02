import type { ReactNode } from "react";

import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface DividerProps {
  orientation?: "horizontal" | "vertical";
  label?: ReactNode;
  className?: string;
}

export function Divider({ orientation = "horizontal", label, className }: DividerProps) {
  if (label && orientation === "horizontal") {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        <Separator orientation="horizontal" className="flex-1" />
        <span className="text-muted-foreground shrink-0 text-xs font-medium tracking-wide uppercase">
          {label}
        </span>
        <Separator orientation="horizontal" className="flex-1" />
      </div>
    );
  }

  return <Separator orientation={orientation} className={className} />;
}

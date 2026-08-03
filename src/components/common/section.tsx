import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface SectionProps {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function Section({ title, description, children, className }: SectionProps) {
  const headingId = title ? `section-${title.toLowerCase().replace(/\s+/g, "-")}` : undefined;

  return (
    <section className={cn("space-y-4", className)} aria-labelledby={headingId}>
      {title || description ? (
        <div className="min-w-0 space-y-1">
          {title ? (
            <h2 id={headingId} className="text-xl font-semibold tracking-tight">
              {title}
            </h2>
          ) : null}
          {description ? <p className="text-muted-foreground text-sm">{description}</p> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

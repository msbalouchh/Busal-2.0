import { cn } from "@/lib/utils";

interface DashboardPageHeadingProps {
  title: string;
  description?: string;
  className?: string;
}

/** In-dashboard page title — use h2 because WorkspaceHeader owns the document h1. */
export function DashboardPageHeading({ title, description, className }: DashboardPageHeadingProps) {
  return (
    <div className={cn("space-y-1", className)}>
      <h2 className="text-lg font-semibold tracking-tight sm:text-xl">{title}</h2>
      {description ? (
        <p className="text-muted-foreground text-sm text-pretty">{description}</p>
      ) : null}
    </div>
  );
}

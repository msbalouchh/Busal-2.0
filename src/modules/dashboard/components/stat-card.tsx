import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: ReactNode;
  description?: string;
  icon?: LucideIcon;
  trend?: string;
  className?: string;
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
}: StatCardProps) {
  return (
    <Card className={cn(className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-muted-foreground text-sm font-medium">{title}</CardTitle>
        {Icon ? <Icon className="text-muted-foreground h-4 w-4" aria-hidden="true" /> : null}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        {description ? <p className="text-muted-foreground mt-1 text-xs">{description}</p> : null}
        {trend ? <p className="text-muted-foreground mt-2 text-xs">{trend}</p> : null}
      </CardContent>
    </Card>
  );
}

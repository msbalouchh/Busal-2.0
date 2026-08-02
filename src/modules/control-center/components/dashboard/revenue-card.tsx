import { TrendingUp } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface RevenueCardProps {
  title: string;
  amountPence: number;
  description?: string;
  className?: string;
}

function formatCurrency(pence: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(pence / 100);
}

export function RevenueCard({ title, amountPence, description, className }: RevenueCardProps) {
  return (
    <Card className={cn(className)} data-component="revenue-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </div>
        <TrendingUp className="text-muted-foreground h-4 w-4" aria-hidden="true" />
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold tracking-tight">{formatCurrency(amountPence)}</p>
      </CardContent>
    </Card>
  );
}

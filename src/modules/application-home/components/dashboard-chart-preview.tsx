"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface ChartBar {
  day: string;
  [key: string]: string | number | undefined;
}

interface DashboardChartPreviewProps {
  title: string;
  description?: string;
  data: ChartBar[];
  valueKey: string;
  summaryLabel?: string;
  formatSummary?: (total: number, peak: { day: string; value: number }) => string;
  className?: string;
}

function getChartSummary(data: ChartBar[], valueKey: string) {
  let total = 0;
  let peak = { day: data[0]?.day ?? "—", value: 0 };

  for (const entry of data) {
    const value = Number(entry[valueKey] ?? 0);
    total += value;

    if (value > peak.value) {
      peak = { day: String(entry.day), value };
    }
  }

  return { total, peak };
}

export function DashboardChartPreview({
  title,
  description,
  data,
  valueKey,
  summaryLabel = "7-day total",
  formatSummary,
  className,
}: DashboardChartPreviewProps) {
  const values = data.map((entry) => Number(entry[valueKey] ?? 0));
  const max = Math.max(...values, 1);
  const { total, peak } = getChartSummary(data, valueKey);
  const summaryText =
    formatSummary?.(total, peak) ??
    `${summaryLabel}: ${total.toLocaleString("en-GB")} · Peak: ${peak.day}`;

  return (
    <Card className={cn("rounded-xl shadow-sm", motion.cardHover, className)}>
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-base font-semibold tracking-tight">{title}</CardTitle>
        {description ? (
          <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className="bg-muted/30 flex h-44 items-end gap-2 rounded-lg border p-4 sm:gap-3"
          role="img"
          aria-label={`${title} chart`}
        >
          {data.map((entry) => {
            const value = Number(entry[valueKey] ?? 0);
            const height = Math.max((value / max) * 100, 6);

            return (
              <div
                key={String(entry.day)}
                className="group flex flex-1 flex-col items-center gap-2"
              >
                <div
                  className={cn(
                    "bg-primary/80 w-full rounded-t-md",
                    "motion-safe:group-hover:bg-primary motion-safe:transition-all motion-safe:duration-300",
                  )}
                  style={{ height: `${height}%` }}
                  aria-hidden="true"
                />
                <span className="text-muted-foreground text-[10px] sm:text-xs">{entry.day}</span>
              </div>
            );
          })}
        </div>

        <div className="border-t pt-4">
          <p className="text-foreground text-sm font-medium">{summaryText}</p>
        </div>
      </CardContent>
    </Card>
  );
}

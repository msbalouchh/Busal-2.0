"use client";

interface AnalyticsTrendBarsProps {
  points: Array<{ day: string; value: number }>;
  comparisonPoints?: Array<{ day: string; value: number }>;
}

export function AnalyticsTrendBars({ points, comparisonPoints }: AnalyticsTrendBarsProps) {
  const values = points.map((point) => point.value);
  const comparisonValues = comparisonPoints?.map((point) => point.value) ?? [];
  const max = Math.max(...values, ...comparisonValues, 1);

  return (
    <div className="flex h-24 items-end gap-2">
      {points.map((point) => {
        const height = Math.max((point.value / max) * 100, 4);

        return (
          <div key={point.day} className="flex flex-1 flex-col items-center gap-1">
            <div className="bg-primary/80 w-full rounded-t" style={{ height: `${height}%` }} />
            <span className="text-muted-foreground text-[10px]">{point.day.slice(5)}</span>
          </div>
        );
      })}
    </div>
  );
}

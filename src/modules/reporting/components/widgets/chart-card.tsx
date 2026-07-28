import type { ReactNode } from "react";

interface ChartCardProps {
  title: string;
  children: ReactNode;
  emptyMessage?: string;
  isEmpty?: boolean;
}

export function ChartCard({ title, children, emptyMessage, isEmpty }: ChartCardProps) {
  return (
    <div className="bg-card rounded-xl border p-4 shadow-sm">
      <h3 className="mb-3 text-lg font-semibold">{title}</h3>
      {isEmpty ? (
        <p className="text-muted-foreground text-sm">{emptyMessage ?? "No data yet."}</p>
      ) : (
        children
      )}
    </div>
  );
}

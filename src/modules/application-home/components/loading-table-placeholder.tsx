import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface LoadingTablePlaceholderProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export function LoadingTablePlaceholder({
  rows = 5,
  columns = 4,
  className,
}: LoadingTablePlaceholderProps) {
  return (
    <div
      className={cn("bg-card overflow-hidden rounded-xl border shadow-sm", className)}
      aria-busy="true"
      aria-label="Loading table"
    >
      <div className="border-b px-4 py-3">
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="divide-y">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex items-center gap-4 px-4 py-3">
            {Array.from({ length: columns }).map((__, columnIndex) => (
              <Skeleton
                key={columnIndex}
                className={cn("h-3", columnIndex === 0 ? "w-32" : "flex-1")}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

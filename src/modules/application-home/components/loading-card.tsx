import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface LoadingCardProps {
  lines?: number;
  className?: string;
}

export function LoadingCard({ lines = 3, className }: LoadingCardProps) {
  return (
    <div
      className={cn("bg-card space-y-3 rounded-xl border p-5 shadow-sm", className)}
      aria-hidden="true"
    >
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4 rounded-full" />
      </div>
      <Skeleton className="h-8 w-32" />
      {Array.from({ length: lines - 1 }).map((_, index) => (
        <Skeleton key={index} className="h-3 w-full max-w-xs" />
      ))}
    </div>
  );
}

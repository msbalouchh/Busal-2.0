import { Skeleton } from "@/components/ui/skeleton";

export function DashboardLoadingSkeleton() {
  return (
    <div className="space-y-6 p-6" aria-busy="true" aria-label="Loading dashboard">
      <Skeleton className="h-28 w-full" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-28 w-full" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}

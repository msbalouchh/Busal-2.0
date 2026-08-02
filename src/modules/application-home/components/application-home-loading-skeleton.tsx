import { LoadingCard } from "@/modules/application-home/components/loading-card";
import { LoadingTablePlaceholder } from "@/modules/application-home/components/loading-table-placeholder";
import { Skeleton } from "@/components/ui/skeleton";

export function ApplicationHomeLoadingSkeleton() {
  return (
    <div
      className="flex flex-1 flex-col gap-8 p-4 sm:p-6 lg:p-8"
      aria-busy="true"
      aria-label="Loading dashboard"
    >
      <div className="space-y-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>

      <Skeleton className="h-36 w-full rounded-2xl" />

      <div className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <LoadingCard key={index} lines={2} />
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-56" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <LoadingCard key={index} lines={3} />
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-56 w-full rounded-xl" />
        <Skeleton className="h-56 w-full rounded-xl" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <LoadingTablePlaceholder rows={4} columns={1} />
        <LoadingCard lines={6} className="h-full" />
      </div>
    </div>
  );
}

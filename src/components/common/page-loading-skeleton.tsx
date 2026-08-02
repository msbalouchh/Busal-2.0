import { Skeleton } from "@/components/ui/skeleton";

interface PageLoadingSkeletonProps {
  label?: string;
}

export function PageLoadingSkeleton({ label = "Loading page" }: PageLoadingSkeletonProps) {
  return (
    <div
      className="mx-auto flex w-full max-w-7xl min-w-0 flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8"
      aria-busy="true"
      aria-label={label}
      role="status"
    >
      <span className="sr-only">{label}</span>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48 max-w-full" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <Skeleton className="h-9 w-28" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-28 w-full rounded-xl" />
        ))}
      </div>

      <Skeleton className="h-64 w-full rounded-xl" />

      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-12 w-full rounded-md" />
        ))}
      </div>
    </div>
  );
}

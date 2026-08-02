import { Skeleton } from "@/components/ui/skeleton";

export function AuthFormSkeleton() {
  return (
    <div className="auth-form" aria-busy="true" aria-label="Loading sign in form">
      <Skeleton className="h-[2.75rem] w-full rounded-md bg-white/10" />
      <Skeleton className="h-[2.75rem] w-full rounded-md bg-white/10" />
      <Skeleton className="h-[2.875rem] w-full rounded-xl bg-white/10" />
      <Skeleton className="h-[2.75rem] w-full rounded-xl bg-white/10" />
    </div>
  );
}

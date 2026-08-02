"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BranchSelector } from "@/modules/branch-management/components/branch-selector";
import { RESTAURANT_ANALYTICS_ROUTES } from "@/modules/restaurant-analytics-management/constants/routes";
import type { RestaurantAnalyticsContext } from "@/modules/restaurant-analytics-management/lib/get-restaurant-analytics-context";

interface AnalyticsFiltersBarProps {
  context: RestaurantAnalyticsContext;
  basePath: string;
}

export function AnalyticsFiltersBar({ context, basePath }: AnalyticsFiltersBarProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [from, setFrom] = useState(context.filters.dateRange.from);
  const [to, setTo] = useState(context.filters.dateRange.to);
  const branchId = context.selectedBranchId;

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (branchId) params.set("branchId", branchId);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    startTransition(() => {
      router.push(`${basePath}?${params.toString()}`);
    });
  };

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <p className="text-sm font-medium">Branch</p>
          <BranchSelector
            branches={context.branches}
            value={branchId ?? undefined}
            onValueChange={(nextBranchId) => {
              startTransition(() => {
                router.push(RESTAURANT_ANALYTICS_ROUTES.dashboardForBranch(nextBranchId, from, to));
              });
            }}
            placeholder="All branches"
            disabled={isPending}
          />
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium">From</p>
          <Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium">To</p>
          <Input type="date" value={to} onChange={(event) => setTo(event.target.value)} />
        </div>
        <div className="flex items-end">
          <Button type="button" onClick={applyFilters} disabled={isPending}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Apply
          </Button>
        </div>
      </div>
    </div>
  );
}

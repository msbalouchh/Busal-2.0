"use client";

import dynamic from "next/dynamic";

import { Skeleton } from "@/components/ui/skeleton";

export const TrendChart = dynamic(
  () =>
    import("@/modules/reporting/components/widgets/trend-chart").then(
      (module) => module.TrendChart,
    ),
  {
    loading: () => <Skeleton className="h-64 w-full rounded-xl" aria-hidden="true" />,
    ssr: false,
  },
);

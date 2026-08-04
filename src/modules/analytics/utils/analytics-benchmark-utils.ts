import type { Benchmark } from "@/modules/analytics/types/analytics-platform";

export interface BenchmarkComparison {
  metricKey: string;
  label: string;
  businessValue: number;
  industryAverage: number;
  topPerformerValue: number;
  vsIndustryPercent: number;
  vsTopPercent: number;
  percentileRank: number;
  performance: "above_average" | "average" | "below_average" | "top_performer";
}

/** Compare business metrics against industry benchmarks. */
export function compareBenchmark(benchmark: Benchmark): BenchmarkComparison {
  const vsIndustryPercent =
    benchmark.industryAverage > 0
      ? ((benchmark.businessValue - benchmark.industryAverage) / benchmark.industryAverage) * 100
      : 0;

  const vsTopPercent =
    benchmark.topPerformerValue > 0
      ? ((benchmark.businessValue - benchmark.topPerformerValue) / benchmark.topPerformerValue) *
        100
      : 0;

  let performance: BenchmarkComparison["performance"] = "average";

  if (benchmark.percentileRank >= 90) {
    performance = "top_performer";
  } else if (benchmark.percentileRank >= 60) {
    performance = "above_average";
  } else if (benchmark.percentileRank < 40) {
    performance = "below_average";
  }

  return {
    metricKey: benchmark.metricKey,
    label: benchmark.label,
    businessValue: benchmark.businessValue,
    industryAverage: benchmark.industryAverage,
    topPerformerValue: benchmark.topPerformerValue,
    vsIndustryPercent: Math.round(vsIndustryPercent * 10) / 10,
    vsTopPercent: Math.round(vsTopPercent * 10) / 10,
    percentileRank: benchmark.percentileRank,
    performance,
  };
}

export function rankBenchmarks(benchmarks: Benchmark[]): BenchmarkComparison[] {
  return benchmarks.map(compareBenchmark).sort((a, b) => b.percentileRank - a.percentileRank);
}

export function getBelowAverageBenchmarks(benchmarks: Benchmark[]): BenchmarkComparison[] {
  return rankBenchmarks(benchmarks).filter((b) => b.performance === "below_average");
}

export function AnalyticsManagementEmpty() {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-2 rounded-xl border bg-card p-8 text-center">
      <h3 className="text-lg font-semibold">No analytics data yet</h3>
      <p className="text-muted-foreground text-sm">Connect your modules and create dashboards to start tracking KPIs.</p>
    </div>
  );
}

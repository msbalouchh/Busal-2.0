export function IntegrationManagementEmpty() {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-2 rounded-xl border bg-card p-8 text-center">
      <h3 className="text-lg font-semibold">No integrations connected</h3>
      <p className="text-muted-foreground text-sm">Connect a provider or generate an API key to get started.</p>
    </div>
  );
}

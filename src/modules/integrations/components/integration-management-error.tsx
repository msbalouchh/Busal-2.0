interface IntegrationManagementErrorProps {
  message?: string;
  onRetry?: () => void;
}

export function IntegrationManagementError({ message, onRetry }: IntegrationManagementErrorProps) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-xl border border-destructive/30 bg-card p-8 text-center">
      <h3 className="text-lg font-semibold text-destructive">Unable to load integrations</h3>
      <p className="text-muted-foreground text-sm">{message ?? "Something went wrong while loading integrations."}</p>
      {onRetry ? (
        <button type="button" className="text-primary text-sm font-medium" onClick={onRetry}>
          Try again
        </button>
      ) : null}
    </div>
  );
}

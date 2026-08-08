interface StaffManagementErrorProps {
  message: string;
  onRetry?: () => void;
}

export function StaffManagementError({ message, onRetry }: StaffManagementErrorProps) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-xl border border-destructive/30 bg-card p-8 text-center">
      <h3 className="text-lg font-semibold text-destructive">Staff unavailable</h3>
      <p className="text-muted-foreground max-w-md text-sm">{message}</p>
      {onRetry ? (
        <button
          type="button"
          className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm"
          onClick={onRetry}
        >
          Retry
        </button>
      ) : null}
    </div>
  );
}

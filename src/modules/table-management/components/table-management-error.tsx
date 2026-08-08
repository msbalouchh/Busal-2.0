interface TableManagementErrorProps {
  message: string;
  onRetry?: () => void;
}

export function TableManagementError({ message, onRetry }: TableManagementErrorProps) {
  return (
    <div
      className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
      role="alert"
    >
      <p>{message}</p>
      {onRetry ? (
        <button
          type="button"
          className="mt-2 underline underline-offset-2"
          onClick={onRetry}
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}

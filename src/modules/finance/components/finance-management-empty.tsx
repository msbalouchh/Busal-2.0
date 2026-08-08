interface FinanceManagementEmptyProps {
  title?: string;
  description?: string;
}

export function FinanceManagementEmpty({
  title = "No financial records",
  description = "Create your first invoice or record an expense to start tracking finances.",
}: FinanceManagementEmptyProps) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center gap-2 rounded-xl border bg-card p-8 text-center">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-muted-foreground max-w-md text-sm">{description}</p>
    </div>
  );
}

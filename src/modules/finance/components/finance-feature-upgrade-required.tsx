interface FinanceFeatureUpgradeRequiredProps {
  moduleLabel?: string;
  planLabel?: string;
  message?: string;
}

export function FinanceFeatureUpgradeRequired({
  moduleLabel = "Finance",
  planLabel,
  message,
}: FinanceFeatureUpgradeRequiredProps) {
  return (
    <div className="flex min-h-96 flex-col items-center justify-center gap-4 rounded-xl border bg-card p-10 text-center">
      <p className="text-primary text-sm font-semibold uppercase tracking-wide">Upgrade Required</p>
      <h2 className="text-2xl font-semibold">{moduleLabel} is not on your plan</h2>
      <p className="text-muted-foreground max-w-lg text-sm">
        {message ??
          `Your current subscription${planLabel ? ` (${planLabel})` : ""} does not include ${moduleLabel}. Upgrade your plan or add the module to continue.`}
      </p>
      <a
        href="/app/billing"
        className="bg-primary text-primary-foreground mt-2 inline-flex rounded-md px-5 py-2.5 text-sm font-medium"
      >
        View plans &amp; upgrade
      </a>
    </div>
  );
}

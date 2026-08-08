export function NotificationManagementEmpty() {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-2 rounded-xl border bg-card p-8 text-center">
      <h3 className="text-lg font-semibold">No notifications yet</h3>
      <p className="text-muted-foreground text-sm">Send your first notification or configure event rules to get started.</p>
    </div>
  );
}

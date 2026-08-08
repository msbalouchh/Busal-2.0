interface StaffManagementEmptyProps {
  title?: string;
  description?: string;
}

export function StaffManagementEmpty({
  title = "No staff members",
  description = "Hire your first employee to start managing your workforce.",
}: StaffManagementEmptyProps) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center gap-2 rounded-xl border bg-card p-8 text-center">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-muted-foreground max-w-md text-sm">{description}</p>
    </div>
  );
}

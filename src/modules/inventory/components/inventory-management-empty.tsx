interface InventoryManagementEmptyProps {
  title?: string;
  description?: string;
}

export function InventoryManagementEmpty({
  title = "No inventory items",
  description = "Create your first inventory item to start tracking stock.",
}: InventoryManagementEmptyProps) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center gap-2 rounded-xl border bg-card p-8 text-center">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-muted-foreground max-w-md text-sm">{description}</p>
    </div>
  );
}

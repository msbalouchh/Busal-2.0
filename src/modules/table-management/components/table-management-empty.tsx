import { LayoutGrid } from "lucide-react";

interface TableManagementEmptyProps {
  title?: string;
  description?: string;
}

export function TableManagementEmpty({
  title = "No tables yet",
  description = "Create a dining area and add tables to start managing your floor plan.",
}: TableManagementEmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-16 text-center">
      <LayoutGrid className="text-muted-foreground h-10 w-10" aria-hidden="true" />
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-muted-foreground mt-1 max-w-md text-sm">{description}</p>
      </div>
    </div>
  );
}

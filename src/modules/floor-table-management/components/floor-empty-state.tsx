import { Grid3X3, Plus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { FLOOR_TABLE_MANAGEMENT_ROUTES } from "@/modules/floor-table-management/constants/routes";

interface FloorEmptyStateProps {
  branchId: string;
  canCreate?: boolean;
}

export function FloorEmptyState({ branchId, canCreate = false }: FloorEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-16 text-center">
      <Grid3X3 className="text-muted-foreground mb-4 h-10 w-10" />
      <h3 className="text-lg font-semibold">No floors yet</h3>
      <p className="text-muted-foreground mt-2 max-w-md text-sm">
        Create floors for this branch, then add tables and design your visual floor plan.
      </p>
      {canCreate ? (
        <Button asChild className="mt-6">
          <Link href={FLOOR_TABLE_MANAGEMENT_ROUTES.floorCreate(branchId)}>
            <Plus className="mr-2 h-4 w-4" />
            Create floor
          </Link>
        </Button>
      ) : null}
    </div>
  );
}

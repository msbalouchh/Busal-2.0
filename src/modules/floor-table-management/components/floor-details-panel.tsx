"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  archiveFloorManagementAction,
  deleteFloorManagementAction,
  duplicateFloorManagementAction,
  restoreFloorManagementAction,
} from "@/modules/floor-table-management/actions/floor-table-management-actions";
import { FloorPlanCanvas } from "@/modules/floor-table-management/components/floor-plan-canvas";
import { FloorStatusBadge } from "@/modules/floor-table-management/components/floor-status-badge";
import { TableStatusBadge } from "@/modules/floor-table-management/components/table-status-badge";
import { FLOOR_TABLE_MANAGEMENT_ROUTES } from "@/modules/floor-table-management/constants/routes";
import type { FloorTableManagementContext } from "@/modules/floor-table-management/lib/get-floor-table-management-context";
import type {
  FloorManagementRecord,
  TableManagementRecord,
} from "@/modules/floor-table-management/types/floor-table-management-types";

interface FloorDetailsPanelProps {
  context: FloorTableManagementContext;
  floor: FloorManagementRecord;
  tables: TableManagementRecord[];
}

export function FloorDetailsPanel({ context, floor, tables }: FloorDetailsPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const branchId = context.selectedBranchId!;

  const runAction = (
    action: () => Promise<unknown>,
    successMessage: string,
    redirectToList = false,
  ) => {
    startTransition(async () => {
      try {
        await action();
        toast.success(successMessage);
        if (redirectToList) {
          router.push(FLOOR_TABLE_MANAGEMENT_ROUTES.floorListForBranch(branchId));
        } else {
          router.refresh();
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Action failed");
      }
    });
  };

  return (
    <div className="space-y-6">
      <section className="rounded-xl border p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">{floor.name}</h2>
            <div className="mt-2">
              <FloorStatusBadge status={floor.status} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {context.permissionsFlags.canUpdateFloors && floor.status !== "ARCHIVED" ? (
              <Button asChild variant="outline">
                <Link href={FLOOR_TABLE_MANAGEMENT_ROUTES.floorEdit(floor.id, branchId)}>
                  Edit floor
                </Link>
              </Button>
            ) : null}
            {context.permissionsFlags.canCreateTables && floor.status !== "ARCHIVED" ? (
              <Button asChild>
                <Link href={FLOOR_TABLE_MANAGEMENT_ROUTES.tableCreate(floor.id, branchId)}>
                  Add table
                </Link>
              </Button>
            ) : null}
            {context.permissionsFlags.canCreateFloors ? (
              <Button
                variant="outline"
                disabled={isPending}
                onClick={() =>
                  runAction(
                    () => duplicateFloorManagementAction(branchId, floor.id),
                    "Floor duplicated",
                  )
                }
              >
                Duplicate
              </Button>
            ) : null}
            {context.permissionsFlags.canDeleteFloors && floor.status !== "ARCHIVED" ? (
              <Button
                variant="destructive"
                disabled={isPending}
                onClick={() =>
                  runAction(
                    () => archiveFloorManagementAction(branchId, floor.id),
                    "Floor archived",
                  )
                }
              >
                Archive
              </Button>
            ) : null}
            {context.permissionsFlags.canUpdateFloors && floor.status === "ARCHIVED" ? (
              <Button
                variant="outline"
                disabled={isPending}
                onClick={() =>
                  runAction(
                    () => restoreFloorManagementAction(branchId, floor.id),
                    "Floor restored",
                  )
                }
              >
                Restore
              </Button>
            ) : null}
            {context.permissionsFlags.canDeleteFloors ? (
              <Button
                variant="ghost"
                disabled={isPending}
                onClick={() =>
                  runAction(
                    () => deleteFloorManagementAction(branchId, floor.id),
                    "Floor deleted",
                    true,
                  )
                }
              >
                Delete
              </Button>
            ) : null}
          </div>
        </div>
        {floor.description ? (
          <p className="text-muted-foreground mt-4 text-sm">{floor.description}</p>
        ) : null}
      </section>

      <FloorPlanCanvas
        branchId={branchId}
        floorId={floor.id}
        tables={tables}
        canUpdate={context.permissionsFlags.canUpdateTables}
      />

      <section className="rounded-xl border p-4 sm:p-6">
        <h3 className="text-lg font-semibold">Tables on this floor</h3>
        {tables.length === 0 ? (
          <p className="text-muted-foreground mt-2 text-sm">No tables yet.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {tables.map((table) => (
              <li
                key={table.id}
                className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
              >
                <div>
                  <Link
                    href={FLOOR_TABLE_MANAGEMENT_ROUTES.tableDetails(floor.id, table.id, branchId)}
                    className="font-medium hover:underline"
                  >
                    {table.tableNumber}
                    {table.tableName ? ` · ${table.tableName}` : ""}
                  </Link>
                  <p className="text-muted-foreground">
                    {table.capacity} seats · {table.shape.toLowerCase()}
                  </p>
                </div>
                <TableStatusBadge status={table.status} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  archiveTableManagementAction,
  deleteTableManagementAction,
  duplicateTableManagementAction,
  moveTableManagementAction,
  restoreTableManagementAction,
} from "@/modules/floor-table-management/actions/floor-table-management-actions";
import { TableStatusBadge } from "@/modules/floor-table-management/components/table-status-badge";
import { FLOOR_TABLE_MANAGEMENT_ROUTES } from "@/modules/floor-table-management/constants/routes";
import type { FloorTableManagementContext } from "@/modules/floor-table-management/lib/get-floor-table-management-context";
import type {
  FloorManagementRecord,
  TableManagementRecord,
} from "@/modules/floor-table-management/types/floor-table-management-types";

interface TableDetailsPanelProps {
  context: FloorTableManagementContext;
  floor: FloorManagementRecord;
  table: TableManagementRecord;
  floors: Array<{ id: string; name: string }>;
}

export function TableDetailsPanel({ context, floor, table, floors }: TableDetailsPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const branchId = context.selectedBranchId!;

  const runAction = (
    action: () => Promise<unknown>,
    successMessage: string,
    redirectToFloor = false,
  ) => {
    startTransition(async () => {
      try {
        await action();
        toast.success(successMessage);
        if (redirectToFloor) {
          router.push(FLOOR_TABLE_MANAGEMENT_ROUTES.floorDetails(floor.id, branchId));
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
            <p className="text-muted-foreground text-sm">{floor.name}</p>
            <h2 className="text-2xl font-semibold tracking-tight">
              {table.tableNumber}
              {table.tableName ? ` · ${table.tableName}` : ""}
            </h2>
            <div className="mt-2">
              <TableStatusBadge status={table.status} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {context.permissionsFlags.canUpdateTables && table.status !== "ARCHIVED" ? (
              <Button asChild variant="outline">
                <Link href={FLOOR_TABLE_MANAGEMENT_ROUTES.tableEdit(floor.id, table.id, branchId)}>
                  Edit table
                </Link>
              </Button>
            ) : null}
            {context.permissionsFlags.canCreateTables ? (
              <Button
                variant="outline"
                disabled={isPending}
                onClick={() =>
                  runAction(
                    () => duplicateTableManagementAction(branchId, floor.id, table.id),
                    "Table duplicated",
                  )
                }
              >
                Duplicate
              </Button>
            ) : null}
            {context.permissionsFlags.canDeleteTables && table.status !== "ARCHIVED" ? (
              <Button
                variant="destructive"
                disabled={isPending}
                onClick={() =>
                  runAction(
                    () => archiveTableManagementAction(branchId, floor.id, table.id),
                    "Table archived",
                  )
                }
              >
                Archive
              </Button>
            ) : null}
            {context.permissionsFlags.canUpdateTables && table.status === "ARCHIVED" ? (
              <Button
                variant="outline"
                disabled={isPending}
                onClick={() =>
                  runAction(
                    () => restoreTableManagementAction(branchId, floor.id, table.id),
                    "Table restored",
                  )
                }
              >
                Restore
              </Button>
            ) : null}
            {context.permissionsFlags.canDeleteTables ? (
              <Button
                variant="ghost"
                disabled={isPending}
                onClick={() =>
                  runAction(
                    () => deleteTableManagementAction(branchId, floor.id, table.id),
                    "Table deleted",
                    true,
                  )
                }
              >
                Delete
              </Button>
            ) : null}
          </div>
        </div>

        <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-muted-foreground text-sm">Capacity</dt>
            <dd className="font-medium">
              {table.minimumCapacity}-{table.capacity}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-sm">Shape</dt>
            <dd className="font-medium capitalize">{table.shape.toLowerCase()}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-sm">Position</dt>
            <dd className="font-medium">
              {Math.round(table.positionX)}, {Math.round(table.positionY)}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-sm">Reservable</dt>
            <dd className="font-medium">{table.isReservable ? "Yes" : "No"}</dd>
          </div>
        </dl>
      </section>

      {context.permissionsFlags.canUpdateTables && floors.length > 1 ? (
        <section className="rounded-xl border p-4 sm:p-6">
          <h3 className="text-lg font-semibold">Move to another floor</h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {floors
              .filter((entry) => entry.id !== floor.id)
              .map((entry) => (
                <Button
                  key={entry.id}
                  variant="outline"
                  size="sm"
                  disabled={isPending}
                  onClick={() =>
                    runAction(
                      () =>
                        moveTableManagementAction(branchId, {
                          branchId,
                          tableId: table.id,
                          targetFloorId: entry.id,
                        }),
                      `Moved to ${entry.name}`,
                    )
                  }
                >
                  {entry.name}
                </Button>
              ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

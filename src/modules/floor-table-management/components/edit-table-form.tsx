"use client";

import { useRouter } from "next/navigation";

import { updateTableManagementAction } from "@/modules/floor-table-management/actions/floor-table-management-actions";
import { TableForm } from "@/modules/floor-table-management/components/table-form";
import { FLOOR_TABLE_MANAGEMENT_ROUTES } from "@/modules/floor-table-management/constants/routes";
import type {
  TableManagementInput,
  TableManagementRecord,
} from "@/modules/floor-table-management/types/floor-table-management-types";

interface EditTableFormProps {
  branchId: string;
  floorId: string;
  table: TableManagementRecord;
}

export function EditTableForm({ branchId, floorId, table }: EditTableFormProps) {
  const router = useRouter();

  const handleSubmit = async (input: TableManagementInput) => {
    await updateTableManagementAction(branchId, table.id, input);
    router.push(FLOOR_TABLE_MANAGEMENT_ROUTES.tableDetails(floorId, table.id, branchId));
    router.refresh();
  };

  return (
    <TableForm
      branchId={branchId}
      floorId={floorId}
      initialTable={{
        tableNumber: table.tableNumber,
        tableName: table.tableName ?? "",
        capacity: table.capacity,
        minimumCapacity: table.minimumCapacity,
        shape: table.shape,
        positionX: table.positionX,
        positionY: table.positionY,
        width: table.width,
        height: table.height,
        rotation: table.rotation,
        isReservable: table.isReservable,
        isMergeable: table.isMergeable,
        notes: table.notes ?? "",
      }}
      submitLabel="Save changes"
      onSubmit={handleSubmit}
    />
  );
}

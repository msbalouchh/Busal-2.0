"use client";

import { useRouter } from "next/navigation";

import { createTableManagementAction } from "@/modules/floor-table-management/actions/floor-table-management-actions";
import { TableForm } from "@/modules/floor-table-management/components/table-form";
import { FLOOR_TABLE_MANAGEMENT_ROUTES } from "@/modules/floor-table-management/constants/routes";
import type { TableManagementInput } from "@/modules/floor-table-management/types/floor-table-management-types";

interface CreateTableFormProps {
  branchId: string;
  floorId: string;
}

export function CreateTableForm({ branchId, floorId }: CreateTableFormProps) {
  const router = useRouter();

  const handleSubmit = async (input: TableManagementInput) => {
    const result = await createTableManagementAction(branchId, input);
    router.push(FLOOR_TABLE_MANAGEMENT_ROUTES.tableDetails(floorId, result.tableId, branchId));
    router.refresh();
  };

  return (
    <TableForm
      branchId={branchId}
      floorId={floorId}
      submitLabel="Create table"
      onSubmit={handleSubmit}
    />
  );
}

"use client";

import { useRouter } from "next/navigation";

import { createFloorManagementAction } from "@/modules/floor-table-management/actions/floor-table-management-actions";
import { FloorForm } from "@/modules/floor-table-management/components/floor-form";
import { FLOOR_TABLE_MANAGEMENT_ROUTES } from "@/modules/floor-table-management/constants/routes";
import type { FloorManagementInput } from "@/modules/floor-table-management/types/floor-table-management-types";

interface CreateFloorFormProps {
  branchId: string;
}

export function CreateFloorForm({ branchId }: CreateFloorFormProps) {
  const router = useRouter();

  const handleSubmit = async (input: FloorManagementInput) => {
    const result = await createFloorManagementAction(branchId, input);
    router.push(FLOOR_TABLE_MANAGEMENT_ROUTES.floorDetails(result.floorId, branchId));
    router.refresh();
  };

  return <FloorForm branchId={branchId} submitLabel="Create floor" onSubmit={handleSubmit} />;
}

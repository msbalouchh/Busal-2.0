"use client";

import { useRouter } from "next/navigation";

import { updateFloorManagementAction } from "@/modules/floor-table-management/actions/floor-table-management-actions";
import { FloorForm } from "@/modules/floor-table-management/components/floor-form";
import { FLOOR_TABLE_MANAGEMENT_ROUTES } from "@/modules/floor-table-management/constants/routes";
import type {
  FloorManagementInput,
  FloorManagementRecord,
} from "@/modules/floor-table-management/types/floor-table-management-types";

interface EditFloorFormProps {
  branchId: string;
  floor: FloorManagementRecord;
}

export function EditFloorForm({ branchId, floor }: EditFloorFormProps) {
  const router = useRouter();

  const handleSubmit = async (input: FloorManagementInput) => {
    await updateFloorManagementAction(branchId, floor.id, input);
    router.push(FLOOR_TABLE_MANAGEMENT_ROUTES.floorDetails(floor.id, branchId));
    router.refresh();
  };

  return (
    <FloorForm
      branchId={branchId}
      initialFloor={{
        name: floor.name,
        description: floor.description ?? "",
        displayOrder: floor.displayOrder,
      }}
      submitLabel="Save changes"
      onSubmit={handleSubmit}
    />
  );
}

"use client";

import { useRouter } from "next/navigation";

import { ReservationForm } from "@/modules/reservation-management/components/reservation-form";
import { createReservationManagementAction } from "@/modules/reservation-management/actions/reservation-management-actions";
import { RESERVATION_MANAGEMENT_ROUTES } from "@/modules/reservation-management/constants/routes";
import type { ReservationManagementInput } from "@/modules/reservation-management/types/reservation-management-types";

interface CreateReservationFormProps {
  branchId: string;
  tables: { id: string; label: string; capacity: number }[];
  staff: { id: string; label: string }[];
  customers: { id: string; label: string; phone: string | null }[];
  disabled?: boolean;
}

export function CreateReservationForm({
  branchId,
  tables,
  staff,
  customers,
  disabled = false,
}: CreateReservationFormProps) {
  const router = useRouter();

  const handleSubmit = async (input: ReservationManagementInput) => {
    const result = await createReservationManagementAction(branchId, input);

    if (result.success) {
      router.push(RESERVATION_MANAGEMENT_ROUTES.details(result.reservationId, branchId));
      router.refresh();
    }
  };

  return (
    <ReservationForm
      branchId={branchId}
      tables={tables}
      staff={staff}
      customers={customers}
      submitLabel="Create reservation"
      disabled={disabled}
      onSubmit={handleSubmit}
    />
  );
}

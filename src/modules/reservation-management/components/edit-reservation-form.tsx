"use client";

import { useRouter } from "next/navigation";

import { ReservationForm } from "@/modules/reservation-management/components/reservation-form";
import { updateReservationManagementAction } from "@/modules/reservation-management/actions/reservation-management-actions";
import { RESERVATION_MANAGEMENT_ROUTES } from "@/modules/reservation-management/constants/routes";
import type {
  ReservationManagementInput,
  ReservationManagementRecord,
} from "@/modules/reservation-management/types/reservation-management-types";

interface EditReservationFormProps {
  branchId: string;
  reservation: ReservationManagementRecord;
  tables: { id: string; label: string; capacity: number }[];
  staff: { id: string; label: string }[];
  customers: { id: string; label: string; phone: string | null }[];
  disabled?: boolean;
}

export function EditReservationForm({
  branchId,
  reservation,
  tables,
  staff,
  customers,
  disabled = false,
}: EditReservationFormProps) {
  const router = useRouter();

  const handleSubmit = async (input: ReservationManagementInput) => {
    const result = await updateReservationManagementAction(branchId, reservation.id, input);

    if (result.success) {
      router.push(RESERVATION_MANAGEMENT_ROUTES.details(reservation.id, branchId));
      router.refresh();
    }
  };

  return (
    <ReservationForm
      branchId={branchId}
      reservationId={reservation.id}
      initialReservation={{
        guestName: reservation.guestName,
        guestPhone: reservation.guestPhone,
        guestEmail: reservation.guestEmail,
        customerId: reservation.customerId,
        restaurantTableId: reservation.restaurantTableId,
        assignedStaffId: reservation.assignedStaffId,
        partySize: reservation.partySize,
        reservationDate: reservation.reservationDate,
        startTime: reservation.startTime,
        endTime: reservation.endTime,
        source: reservation.source,
        specialRequests: reservation.specialRequests,
        notes: reservation.notes,
      }}
      tables={tables}
      staff={staff}
      customers={customers}
      submitLabel="Save changes"
      disabled={disabled}
      onSubmit={handleSubmit}
    />
  );
}

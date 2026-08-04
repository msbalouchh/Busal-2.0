import { reservationRepository } from "@/modules/reservations/repository/reservation-repository";
import type {
  AssignTableInput,
  CancelReservationInput,
  CreateReservationInput,
  ReservationPlatformContext,
  ReservationRecord,
  ReservationSearchQuery,
  ReservationTimeSlot,
  UpdateReservationInput,
  WaitlistEntryInput,
} from "@/modules/reservations/types/reservations";

export class ReservationService {
  listReservations(context?: ReservationPlatformContext): ReservationRecord[] {
    const records = reservationRepository.listReservations();
    if (!context) return records;

    return records.filter(
      (record) =>
        record.reservation.tenantId === context.tenantId &&
        record.reservation.businessId === context.businessId,
    );
  }

  getById(reservationId: string): ReservationRecord | undefined {
    return reservationRepository.findById(reservationId);
  }

  search(query: ReservationSearchQuery, context?: ReservationPlatformContext): ReservationRecord[] {
    return reservationRepository.search({
      ...query,
      tenantId: query.tenantId ?? context?.tenantId,
      businessId: query.businessId ?? context?.businessId,
      branchId: query.branchId ?? context?.branchId,
    });
  }

  create(input: CreateReservationInput): ReservationRecord {
    return reservationRepository.create(input);
  }

  update(input: UpdateReservationInput): ReservationRecord | undefined {
    return reservationRepository.update(input);
  }

  cancel(input: CancelReservationInput): ReservationRecord | undefined {
    return reservationRepository.cancel(input);
  }

  assignTable(input: AssignTableInput): ReservationRecord | undefined {
    return reservationRepository.assignTable(input);
  }

  addToWaitlist(input: WaitlistEntryInput): ReservationRecord | undefined {
    return reservationRepository.addToWaitlist(input);
  }

  listWaitlist(branchId?: string): ReservationRecord[] {
    return reservationRepository.listWaitlist(branchId);
  }

  listTimeSlots(): ReservationTimeSlot[] {
    return reservationRepository.listTimeSlots();
  }
}

export const reservationService = new ReservationService();

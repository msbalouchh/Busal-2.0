import "server-only";

import { DOMAIN_EVENT_TYPES } from "@/modules/platform-orchestration/constants/domain-events";
import {
  moduleScopeFromPlatform,
  publishModuleDomainEvent,
} from "@/modules/platform-orchestration/lib/publish-module-event";
import type { ReservationStatus } from "@prisma/client";

import { RESERVATION_STATUSES } from "@/modules/reservations/constants/reservation-status";
import type { ClientReservationData } from "@/modules/reservations/lib/reservation-mappers";
import { buildReservationScopeFromInput } from "@/modules/reservations/lib/reservation-scope";
import {
  reservationRepository,
  type ReservationSearchResult,
} from "@/modules/reservations/repository/reservation-repository";
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
import type {
  AddReservationNoteSchemaInput,
  AddReservationTagSchemaInput,
  BulkUpdateReservationsSchemaInput,
  MergeReservationsSchemaInput,
} from "@/modules/reservations/validation/reservation-schemas";

function toScope(context: ReservationPlatformContext) {
  return buildReservationScopeFromInput(context);
}

export class ReservationService {
  async listReservations(context: ReservationPlatformContext): Promise<ReservationRecord[]> {
    return reservationRepository.listReservations(toScope(context));
  }

  async listClientReservations(context: ReservationPlatformContext): Promise<ClientReservationData[]> {
    return reservationRepository.listClientReservations(toScope(context));
  }

  async getById(
    context: ReservationPlatformContext,
    reservationId: string,
  ): Promise<ReservationRecord | null> {
    return reservationRepository.findById(toScope(context), reservationId);
  }

  async search(
    query: ReservationSearchQuery,
    context: ReservationPlatformContext,
  ): Promise<ReservationSearchResult> {
    return reservationRepository.search(toScope(context), {
      ...query,
      tenantId: query.tenantId ?? context.tenantId,
      businessId: query.businessId ?? context.businessId,
      branchId: query.branchId ?? context.branchId,
    });
  }

  async create(
    context: ReservationPlatformContext,
    input: CreateReservationInput,
  ): Promise<ReservationRecord> {
    const record = await reservationRepository.create(toScope(context), input);
    await publishModuleDomainEvent(moduleScopeFromPlatform(context), {
      eventType: DOMAIN_EVENT_TYPES.RESERVATION_CREATED,
      aggregateId: record.reservation.id,
      payload: {
        reservationId: record.reservation.id,
        customerId: record.guest.customerId ?? null,
        tableId: record.seating.assignedTableId ?? null,
        status: record.reservation.status,
      },
    });
    return record;
  }

  async update(
    context: ReservationPlatformContext,
    input: UpdateReservationInput,
  ): Promise<ReservationRecord | null> {
    const record = await reservationRepository.update(toScope(context), input);
    if (record) {
      await publishModuleDomainEvent(moduleScopeFromPlatform(context), {
        eventType: DOMAIN_EVENT_TYPES.RESERVATION_UPDATED,
        aggregateId: record.reservation.id,
        payload: { reservationId: record.reservation.id, status: record.reservation.status },
        idempotencyKey: `reservation.updated:${record.reservation.id}:${record.reservation.status}`,
      });
    }
    return record;
  }

  async cancel(
    context: ReservationPlatformContext,
    input: CancelReservationInput,
  ): Promise<ReservationRecord | null> {
    const record = await reservationRepository.cancel(toScope(context), input);
    if (record) {
      await publishModuleDomainEvent(moduleScopeFromPlatform(context), {
        eventType: DOMAIN_EVENT_TYPES.RESERVATION_CANCELLED,
        aggregateId: record.reservation.id,
        payload: { reservationId: record.reservation.id, reason: input.reason ?? null },
      });
    }
    return record;
  }

  async confirm(
    context: ReservationPlatformContext,
    reservationId: string,
  ): Promise<ReservationRecord | null> {
    return reservationRepository.confirm(toScope(context), reservationId);
  }

  async checkIn(
    context: ReservationPlatformContext,
    reservationId: string,
  ): Promise<ReservationRecord | null> {
    return reservationRepository.checkIn(toScope(context), reservationId);
  }

  async markNoShow(
    context: ReservationPlatformContext,
    reservationId: string,
  ): Promise<ReservationRecord | null> {
    return reservationRepository.markNoShow(toScope(context), reservationId);
  }

  async assignTable(
    context: ReservationPlatformContext,
    input: AssignTableInput,
  ): Promise<ReservationRecord | null> {
    return reservationRepository.assignTable(toScope(context), input);
  }

  async addToWaitlist(
    context: ReservationPlatformContext,
    input: WaitlistEntryInput,
  ): Promise<ReservationRecord | null> {
    return reservationRepository.addToWaitlist(toScope(context), input);
  }

  async listWaitlist(context: ReservationPlatformContext): Promise<ReservationRecord[]> {
    return reservationRepository.listWaitlist(toScope(context));
  }

  async archive(
    context: ReservationPlatformContext,
    reservationId: string,
  ): Promise<ReservationRecord | null> {
    return reservationRepository.archive(toScope(context), reservationId);
  }

  async restore(
    context: ReservationPlatformContext,
    reservationId: string,
  ): Promise<ReservationRecord | null> {
    return reservationRepository.restore(toScope(context), reservationId);
  }

  async deleteHard(context: ReservationPlatformContext, reservationId: string): Promise<boolean> {
    return reservationRepository.deleteHard(toScope(context), reservationId);
  }

  async bulkUpdate(
    context: ReservationPlatformContext,
    input: BulkUpdateReservationsSchemaInput,
  ): Promise<number> {
    return reservationRepository.bulkUpdate(toScope(context), input);
  }

  async mergeReservations(
    context: ReservationPlatformContext,
    input: MergeReservationsSchemaInput,
  ): Promise<ReservationRecord | null> {
    return reservationRepository.mergeReservations(toScope(context), input);
  }

  async addNote(
    context: ReservationPlatformContext,
    input: AddReservationNoteSchemaInput,
  ): Promise<ReservationRecord | null> {
    return reservationRepository.addNote(toScope(context), input);
  }

  async addTag(
    context: ReservationPlatformContext,
    input: AddReservationTagSchemaInput,
  ): Promise<ReservationRecord | null> {
    return reservationRepository.addTag(toScope(context), input);
  }

  async listTimeSlots(context: ReservationPlatformContext, date: string): Promise<ReservationTimeSlot[]> {
    return reservationRepository.listTimeSlots(toScope(context), date);
  }

  async updatePrismaStatus(
    context: ReservationPlatformContext,
    reservationId: string,
    status: ReservationStatus,
  ): Promise<ReservationRecord | null> {
    const domainMap = {
      PENDING: RESERVATION_STATUSES.PENDING,
      CONFIRMED: RESERVATION_STATUSES.CONFIRMED,
      SEATED: RESERVATION_STATUSES.SEATED,
      COMPLETED: RESERVATION_STATUSES.COMPLETED,
      CANCELLED: RESERVATION_STATUSES.CANCELLED,
      NO_SHOW: RESERVATION_STATUSES.NO_SHOW,
    } as const;

    return this.update(context, {
      reservationId,
      status: domainMap[status],
    });
  }
}

export const reservationService = new ReservationService();

import type { ReservationTimeSlot } from "@/modules/reservations/types/reservations";

/** Calculate remaining capacity for a time slot. */
export function getSlotRemainingCovers(slot: ReservationTimeSlot): number {
  return Math.max(0, slot.maxCovers - slot.bookedCovers);
}

/** Check whether a party fits within slot capacity. */
export function canAccommodateParty(slot: ReservationTimeSlot, partySize: number): boolean {
  if (slot.isBlocked) return false;
  return getSlotRemainingCovers(slot) >= partySize;
}

/** Find slots that can fit a party on a given date. */
export function findAvailableSlots(
  slots: ReservationTimeSlot[],
  date: string,
  partySize: number,
): ReservationTimeSlot[] {
  return slots.filter((slot) => slot.date === date && canAccommodateParty(slot, partySize));
}

/** Format reservation time window for display. */
export function formatTimeWindow(startTime: string, endTime: string): string {
  return `${startTime} – ${endTime}`;
}

/** Calculate waitlist position label. */
export function formatWaitlistPosition(position: number): string {
  if (position === 1) return "Next";
  return `#${position} in queue`;
}

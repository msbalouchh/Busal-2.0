import type { ReservationSource, ReservationStatus } from "@prisma/client";

import type {
  RESERVATION_SORT_OPTIONS,
  ReservationViewMode,
} from "@/modules/reservation-management/constants/routes";

export type ReservationSortField = (typeof RESERVATION_SORT_OPTIONS)[number]["value"];

export interface ReservationManagementInput {
  branchId: string;
  guestName: string;
  guestPhone: string;
  guestEmail?: string | null;
  customerId?: string | null;
  restaurantTableId?: string | null;
  assignedStaffId?: string | null;
  partySize: number;
  reservationDate: string;
  startTime: string;
  endTime: string;
  source?: ReservationSource;
  specialRequests?: string | null;
  notes?: string | null;
}

export interface AssignReservationTableInput {
  branchId: string;
  reservationId: string;
  restaurantTableId: string;
}

export interface AssignReservationStaffInput {
  branchId: string;
  reservationId: string;
  assignedStaffId: string | null;
}

export interface ReservationListQuery {
  branchId: string;
  search?: string;
  status?: ReservationStatus | "ALL";
  source?: ReservationSource | "ALL";
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: ReservationSortField;
  sortDirection?: "asc" | "desc";
  page?: number;
  pageSize?: number;
  view?: ReservationViewMode;
}

export interface ReservationStaffSummary {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
}

export interface ReservationCustomerSummary {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
}

export interface ReservationTableSummary {
  id: string;
  tableNumber: string;
  tableName: string | null;
  capacity: number;
  floorName: string;
}

export interface ReservationManagementRecord {
  id: string;
  businessId: string;
  branchId: string;
  reservationNumber: string;
  guestName: string;
  guestPhone: string;
  guestEmail: string | null;
  customerId: string | null;
  customer: ReservationCustomerSummary | null;
  restaurantTableId: string | null;
  restaurantTable: ReservationTableSummary | null;
  assignedStaffId: string | null;
  assignedStaff: ReservationStaffSummary | null;
  partySize: number;
  reservationDate: string;
  startTime: string;
  endTime: string;
  status: ReservationStatus;
  source: ReservationSource;
  specialRequests: string | null;
  notes: string | null;
  checkInTime: string | null;
  checkOutTime: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReservationListResult {
  items: ReservationManagementRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ReservationDashboardStats {
  totalToday: number;
  pendingToday: number;
  confirmedToday: number;
  seatedToday: number;
  completedToday: number;
  cancelledToday: number;
  noShowToday: number;
  upcomingWeek: number;
}

export interface TableAvailabilitySlot {
  restaurantTableId: string;
  tableNumber: string;
  tableName: string | null;
  floorName: string;
  capacity: number;
  minimumCapacity: number;
  isAvailable: boolean;
  conflictReason?: string;
}

export interface TableAvailabilityQuery {
  branchId: string;
  reservationDate: string;
  startTime: string;
  endTime: string;
  partySize: number;
  excludeReservationId?: string;
}

export interface CalendarReservationEntry {
  id: string;
  reservationNumber: string;
  guestName: string;
  partySize: number;
  reservationDate: string;
  startTime: string;
  endTime: string;
  status: ReservationStatus;
  restaurantTableId: string | null;
  tableLabel: string | null;
}

export interface ReservationSelectOption {
  id: string;
  label: string;
  sublabel?: string;
}

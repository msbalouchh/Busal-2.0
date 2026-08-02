import type { FloorStatus, RestaurantTableStatus, TableShape } from "@prisma/client";

import type {
  FLOOR_SORT_OPTIONS,
  TABLE_SORT_OPTIONS,
} from "@/modules/floor-table-management/constants/routes";

export type FloorSortField = (typeof FLOOR_SORT_OPTIONS)[number]["value"];
export type TableSortField = (typeof TABLE_SORT_OPTIONS)[number]["value"];

export interface FloorManagementInput {
  branchId: string;
  name: string;
  description?: string | null;
  displayOrder?: number;
}

export interface TableManagementInput {
  branchId: string;
  floorId: string;
  tableNumber: string;
  tableName?: string | null;
  capacity: number;
  minimumCapacity?: number;
  shape?: TableShape;
  positionX?: number;
  positionY?: number;
  width?: number;
  height?: number;
  rotation?: number;
  isReservable?: boolean;
  isMergeable?: boolean;
  notes?: string | null;
}

export interface TablePositionInput {
  tableId: string;
  positionX: number;
  positionY: number;
  rotation?: number;
}

export interface MergeTablesInput {
  branchId: string;
  targetTableId: string;
  sourceTableIds: string[];
}

export interface SplitTablesInput {
  branchId: string;
  targetTableId: string;
  sourceTableIds: string[];
}

export interface MoveTableInput {
  branchId: string;
  tableId: string;
  targetFloorId: string;
}

export interface FloorManagementRecord {
  id: string;
  businessId: string;
  branchId: string;
  name: string;
  description: string | null;
  displayOrder: number;
  status: FloorStatus;
  tableCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TableManagementRecord {
  id: string;
  businessId: string;
  branchId: string;
  floorId: string;
  floorName: string;
  tableNumber: string;
  tableName: string | null;
  capacity: number;
  minimumCapacity: number;
  shape: TableShape;
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  rotation: number;
  status: RestaurantTableStatus;
  isReservable: boolean;
  isMergeable: boolean;
  mergedIntoTableId: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FloorListQuery {
  branchId: string;
  search?: string;
  status?: FloorStatus | "ALL";
  sortBy?: FloorSortField;
  sortDirection?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface TableListQuery {
  branchId: string;
  floorId?: string;
  search?: string;
  status?: RestaurantTableStatus | "ALL";
  sortBy?: TableSortField;
  sortDirection?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface FloorListResult {
  items: FloorManagementRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface TableListResult {
  items: TableManagementRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface FloorTableDashboardStats {
  totalFloors: number;
  activeFloors: number;
  totalTables: number;
  availableTables: number;
  occupiedTables: number;
  reservedTables: number;
}

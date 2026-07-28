import type { ReservationStatus, TableStatus } from "@prisma/client";

import type { TableData } from "@/services/table.service";

export interface ClientTableReservation {
  id: string;
  customerName: string;
  reservationNumber: string;
  status: ReservationStatus;
}

export type ClientTable = Omit<TableData, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
  currentReservation: ClientTableReservation | null;
};

export interface TableStats {
  total: number;
  available: number;
  reserved: number;
  occupied: number;
  cleaning: number;
  outOfService: number;
}

export function serializeTable(
  table: TableData,
  currentReservation: ClientTableReservation | null = null,
): ClientTable {
  return {
    ...table,
    createdAt: table.createdAt.toISOString(),
    updatedAt: table.updatedAt.toISOString(),
    currentReservation,
  };
}

export function formatTableStatusLabel(status: TableStatus): string {
  return status
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

export function computeTableStats(tables: ClientTable[]): TableStats {
  return {
    total: tables.length,
    available: tables.filter((table) => table.status === "AVAILABLE").length,
    reserved: tables.filter((table) => table.status === "RESERVED").length,
    occupied: tables.filter((table) => table.status === "OCCUPIED").length,
    cleaning: tables.filter((table) => table.status === "CLEANING").length,
    outOfService: tables.filter((table) => table.status === "OUT_OF_SERVICE").length,
  };
}

export function getUniqueSections(tables: ClientTable[]): string[] {
  const sections = new Set<string>();

  for (const table of tables) {
    if (table.section) {
      sections.add(table.section);
    }
  }

  return [...sections].sort((a, b) => a.localeCompare(b));
}

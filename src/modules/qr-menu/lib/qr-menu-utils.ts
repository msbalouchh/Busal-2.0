import type { QRCodeData } from "@/services/qr-menu.service";

export type ClientQRCode = Omit<QRCodeData, "lastScannedAt" | "createdAt" | "updatedAt"> & {
  lastScannedAt: string | null;
  createdAt: string;
  updatedAt: string;
  tableName: string | null;
};

export interface QRMenuStats {
  total: number;
  active: number;
  inactive: number;
  assignedToTables: number;
  totalScans: number;
}

export interface ClientTableOption {
  id: string;
  name: string;
}

export function serializeQRCode(qrCode: QRCodeData, tableName: string | null = null): ClientQRCode {
  return {
    ...qrCode,
    lastScannedAt: qrCode.lastScannedAt?.toISOString() ?? null,
    createdAt: qrCode.createdAt.toISOString(),
    updatedAt: qrCode.updatedAt.toISOString(),
    tableName,
  };
}

export function computeQRMenuStats(qrCodes: ClientQRCode[]): QRMenuStats {
  return {
    total: qrCodes.length,
    active: qrCodes.filter((item) => item.isActive).length,
    inactive: qrCodes.filter((item) => !item.isActive).length,
    assignedToTables: qrCodes.filter((item) => item.tableId).length,
    totalScans: qrCodes.reduce((sum, item) => sum + item.scanCount, 0),
  };
}

export function formatLastScanned(value: string | null): string {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatQRCodeStatus(isActive: boolean): string {
  return isActive ? "Active" : "Inactive";
}

export function serializeTableOptions(tables: { id: string; name: string }[]): ClientTableOption[] {
  return tables.map((table) => ({ id: table.id, name: table.name }));
}

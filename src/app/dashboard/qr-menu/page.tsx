import type { Metadata } from "next";

import { QRMenuManager } from "@/modules/qr-menu/components/qr-menu-manager";
import { QRMenuOverview } from "@/modules/qr-menu/components/qr-menu-overview";
import { QRMenuPageHeader } from "@/modules/qr-menu/components/qr-menu-page-header";
import { getQRMenuModuleContext } from "@/modules/qr-menu/lib/get-qr-menu-context";
import {
  computeQRMenuStats,
  serializeQRCode,
  serializeTableOptions,
} from "@/modules/qr-menu/lib/qr-menu-utils";

export const metadata: Metadata = {
  title: "QR Menu",
};

export default async function QRMenuPage() {
  const { qrCodes, tables } = await getQRMenuModuleContext();

  const tableNameById = new Map(tables.map((table) => [table.id, table.name]));
  const clientQRCodes = qrCodes.map((qrCode) =>
    serializeQRCode(qrCode, qrCode.tableId ? (tableNameById.get(qrCode.tableId) ?? null) : null),
  );
  const stats = computeQRMenuStats(clientQRCodes);
  const tableOptions = serializeTableOptions(tables);

  return (
    <div className="space-y-6">
      <QRMenuPageHeader
        title="QR Menu"
        description="Manage QR codes, table assignments, and scan activity."
      />
      <QRMenuOverview stats={stats} />
      <QRMenuManager qrCodes={clientQRCodes} tables={tableOptions} />
    </div>
  );
}

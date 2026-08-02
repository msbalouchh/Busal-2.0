import type { Metadata } from "next";

import { TablePageHeader } from "@/modules/tables/components/table-page-header";
import { TablesManager } from "@/modules/tables/components/tables-manager";
import { TablesOverview } from "@/modules/tables/components/tables-overview";
import { getTableModuleContext } from "@/modules/tables/lib/get-table-context";
import { computeTableStats, serializeTable } from "@/modules/tables/lib/table-utils";

export const metadata: Metadata = {
  title: "Tables",
};

export default async function TablesPage() {
  const { tables, activeReservations } = await getTableModuleContext();

  const reservationByTableId = new Map(
    activeReservations
      .filter((reservation) => reservation.legacyTableId)
      .map((reservation) => [
        reservation.legacyTableId as string,
        {
          id: reservation.id,
          customerName: reservation.guestName,
          reservationNumber: reservation.reservationNumber,
          status: reservation.status,
        },
      ]),
  );

  const clientTables = tables.map((table) =>
    serializeTable(table, reservationByTableId.get(table.id) ?? null),
  );
  const stats = computeTableStats(clientTables);

  return (
    <div className="space-y-6">
      <TablePageHeader
        title="Tables"
        description="Manage seating, track table status, and view current reservations."
      />
      <TablesOverview stats={stats} />
      <TablesManager tables={clientTables} />
    </div>
  );
}

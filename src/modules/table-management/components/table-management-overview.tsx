"use client";

import { TableManagementEmpty } from "@/modules/table-management/components/table-management-empty";
import { TableManagementError } from "@/modules/table-management/components/table-management-error";
import { TableManagementLoading } from "@/modules/table-management/components/table-management-loading";
import { TableStatusBadge } from "@/modules/table-management/components/table-status-badge";
import { useTableManagement } from "@/modules/table-management/hooks/use-table-management";
import type { TablePlatformSnapshot } from "@/modules/table-management/types/table-management";

interface TableManagementOverviewProps {
  initialSnapshot?: TablePlatformSnapshot;
}

export function TableManagementOverview({ initialSnapshot }: TableManagementOverviewProps) {
  const { floors, snapshot, isRefreshing, error, refresh, searchTables } = useTableManagement();
  const activeSnapshot = snapshot ?? initialSnapshot;
  const tables = floors.flatMap((floor) => floor.tables);

  if (isRefreshing && tables.length === 0) {
    return <TableManagementLoading />;
  }

  if (error) {
    return <TableManagementError message={error} onRetry={refresh} />;
  }

  if (tables.length === 0) {
    return <TableManagementEmpty />;
  }

  const visibleTables = searchTables({ limit: 12 });

  return (
    <div className="space-y-6">
      {activeSnapshot ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Tables" value={activeSnapshot.tableCount} />
          <StatCard label="Available" value={activeSnapshot.availableCount} />
          <StatCard label="Occupied" value={activeSnapshot.occupiedCount} />
          <StatCard label="Occupancy" value={`${activeSnapshot.realtimeOccupancyPercent}%`} />
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {visibleTables.map((record) => (
          <article
            key={record.table.id}
            className="rounded-lg border bg-card p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-medium">{record.table.label}</h3>
                <p className="text-muted-foreground text-sm">
                  {record.table.seatCapacity} seats · Floor {record.table.floorId.slice(0, 8)}
                </p>
              </div>
              <TableStatusBadge status={record.table.status} />
            </div>
            {record.qrCode?.isActive ? (
              <p className="text-muted-foreground mt-3 truncate text-xs">QR active</p>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-muted-foreground text-sm">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

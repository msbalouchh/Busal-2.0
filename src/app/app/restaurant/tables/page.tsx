import type { Metadata } from "next";

import { TableManagementOverview } from "@/modules/table-management/components/table-management-overview";
import { getTableManagementContext } from "@/modules/table-management/lib/get-table-management-context";
import { TableManagementProvider } from "@/modules/table-management/providers/table-management-provider";

export const metadata: Metadata = {
  title: "Table Management",
};

export default async function TableManagementPage() {
  const { snapshot, platformContext } = await getTableManagementContext();

  return (
    <TableManagementProvider initialInput={platformContext} initialSnapshot={snapshot}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Table Management</h1>
          <p className="text-muted-foreground text-sm">
            Production floor layout, table status, merge/split, QR assignment, and seating
            intelligence.
          </p>
        </div>
        <TableManagementOverview initialSnapshot={snapshot} />
      </div>
    </TableManagementProvider>
  );
}

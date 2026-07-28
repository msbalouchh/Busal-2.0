import Link from "next/link";

import { BRANCH_ROUTES } from "@/modules/branches/constants/routes";
import type { CentralBranchDashboardView } from "@/modules/branches/utils/branch-utils";
import { formatBranchMoney } from "@/modules/branches/utils/branch-utils";

interface CentralBranchDashboardProps {
  dashboard: CentralBranchDashboardView;
}

export function CentralBranchDashboard({ dashboard }: CentralBranchDashboardProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <p className="text-muted-foreground text-sm">Total Branches</p>
          <p className="text-2xl font-semibold">{dashboard.totalBranches}</p>
        </div>
        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <p className="text-muted-foreground text-sm">Total Staff</p>
          <p className="text-2xl font-semibold">{dashboard.totalStaff}</p>
        </div>
        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <p className="text-muted-foreground text-sm">Today&apos;s Orders</p>
          <p className="text-2xl font-semibold">{dashboard.todayOrders}</p>
        </div>
        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <p className="text-muted-foreground text-sm">Today&apos;s Revenue</p>
          <p className="text-2xl font-semibold">{formatBranchMoney(dashboard.todayRevenuePence)}</p>
        </div>
      </div>

      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <h3 className="mb-3 text-lg font-semibold">Branches</h3>
        {dashboard.branches.length === 0 ? (
          <p className="text-muted-foreground text-sm">No branches configured.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {dashboard.branches.map((branch) => (
              <li key={branch.id} className="flex items-center justify-between gap-3">
                <Link
                  href={BRANCH_ROUTES.branch(branch.id)}
                  className="font-medium hover:underline"
                >
                  {branch.name}
                  {branch.isMain ? " (Main)" : ""}
                </Link>
                <span className="text-muted-foreground">
                  {branch.todayOrders} orders · {formatBranchMoney(branch.todayRevenuePence)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

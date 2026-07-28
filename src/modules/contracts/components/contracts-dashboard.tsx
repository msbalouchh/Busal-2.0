import type { ContractsDashboardView } from "@/modules/contracts/utils/contract-utils";
import { formatContractMoney } from "@/modules/contracts/utils/contract-utils";

interface ContractsDashboardProps {
  dashboard: ContractsDashboardView;
}

export function ContractsDashboard({ dashboard }: ContractsDashboardProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Total Contracts</p>
        <p className="text-2xl font-semibold">{dashboard.totalContracts}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Active</p>
        <p className="text-2xl font-semibold">{dashboard.activeContracts}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Pending Signature</p>
        <p className="text-2xl font-semibold">{dashboard.pendingSignatureContracts}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Contract Value</p>
        <p className="text-2xl font-semibold">
          {formatContractMoney(dashboard.totalContractValuePence)}
        </p>
        <p className="text-muted-foreground mt-1 text-xs">
          {dashboard.upcomingRenewals} upcoming renewals
        </p>
      </div>
    </div>
  );
}

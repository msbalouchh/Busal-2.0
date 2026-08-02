import Link from "next/link";

import { COMMERCIAL_PLATFORM_ROUTES } from "@/modules/commercial-platform/constants/commercial-platform";
import { ContractsList } from "@/modules/contracts/components/contracts-lists";
import { CONTRACT_STATUS_LABELS } from "@/modules/contracts/constants/routes";
import type {
  ContractView,
  ContractsDashboardView,
} from "@/modules/contracts/utils/contract-utils";
import { formatContractMoney } from "@/modules/contracts/utils/contract-utils";

interface CommercialContractsPanelProps {
  contracts: ContractView[];
  dashboard: ContractsDashboardView;
}

export function CommercialContractsPanel({ contracts, dashboard }: CommercialContractsPanelProps) {
  const expiringSoon = contracts.filter((contract) => contract.status === "ACTIVE").slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border p-4">
          <p className="text-muted-foreground text-sm">Total contracts</p>
          <p className="text-2xl font-semibold">{dashboard.totalContracts}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-muted-foreground text-sm">Active</p>
          <p className="text-2xl font-semibold">{dashboard.activeContracts}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-muted-foreground text-sm">Upcoming renewals</p>
          <p className="text-2xl font-semibold">{dashboard.upcomingRenewals}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-muted-foreground text-sm">Contract value</p>
          <p className="text-2xl font-semibold">
            {formatContractMoney(dashboard.totalContractValuePence)}
          </p>
        </div>
      </div>

      <div className="rounded-lg border p-4">
        <h2 className="mb-3 font-semibold">Expiry alerts</h2>
        {expiringSoon.length === 0 ? (
          <p className="text-muted-foreground text-sm">No active contract alerts.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {expiringSoon.map((contract) => (
              <li key={contract.id}>
                {contract.contractNumber} · {CONTRACT_STATUS_LABELS[contract.status]}
              </li>
            ))}
          </ul>
        )}
      </div>

      <ContractsList contracts={contracts.slice(0, 10)} />

      <Link
        href={COMMERCIAL_PLATFORM_ROUTES.contractsModule}
        className="text-primary text-sm hover:underline"
      >
        Manage contract documents and renewals
      </Link>
    </div>
  );
}

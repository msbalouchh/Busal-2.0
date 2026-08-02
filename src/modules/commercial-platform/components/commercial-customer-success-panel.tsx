import Link from "next/link";

import { COMMERCIAL_PLATFORM_ROUTES } from "@/modules/commercial-platform/constants/commercial-platform";
import { Customer360ProfilesList } from "@/modules/customer-success/components/customer-success-lists";
import { CUSTOMER_HEALTH_STATUS_LABELS } from "@/modules/customer-success/constants/routes";
import type {
  Customer360ProfileView,
  CustomerSuccessDashboardView,
} from "@/modules/customer-success/utils/customer-success-utils";
import { formatRevopsMoney } from "@/modules/revops/utils/revops-utils";

interface CommercialCustomerSuccessPanelProps {
  profiles: Customer360ProfileView[];
  dashboard: CustomerSuccessDashboardView;
}

export function CommercialCustomerSuccessPanel({
  profiles,
  dashboard,
}: CommercialCustomerSuccessPanelProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border p-4">
          <p className="text-muted-foreground text-sm">Accounts</p>
          <p className="text-2xl font-semibold">{dashboard.totalAccounts}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-muted-foreground text-sm">Healthy</p>
          <p className="text-2xl font-semibold">{dashboard.healthyAccounts}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-muted-foreground text-sm">At risk</p>
          <p className="text-2xl font-semibold">{dashboard.atRiskAccounts}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-muted-foreground text-sm">Expansion pipeline</p>
          <p className="text-2xl font-semibold">
            {formatRevopsMoney(dashboard.expansionPipelinePence)}
          </p>
        </div>
      </div>

      <div className="rounded-lg border p-4">
        <h2 className="mb-3 font-semibold">Customer health</h2>
        <Customer360ProfilesList profiles={profiles.slice(0, 8)} />
      </div>

      <div className="rounded-lg border p-4">
        <h2 className="mb-3 font-semibold">Renewal status</h2>
        <p className="text-sm">
          {dashboard.upcomingRenewals} upcoming renewals · {dashboard.openTasks} open success tasks
          · {dashboard.openFeedback} open feedback items
        </p>
        <ul className="mt-3 space-y-2 text-sm">
          {profiles
            .filter((profile) => profile.healthStatus !== "HEALTHY")
            .slice(0, 5)
            .map((profile) => (
              <li key={profile.id}>
                {profile.customerName} ·{" "}
                {CUSTOMER_HEALTH_STATUS_LABELS[
                  profile.healthStatus as keyof typeof CUSTOMER_HEALTH_STATUS_LABELS
                ] ?? profile.healthStatus}
              </li>
            ))}
        </ul>
      </div>

      <Link
        href={COMMERCIAL_PLATFORM_ROUTES.customerSuccessModule}
        className="text-primary text-sm hover:underline"
      >
        Open playbooks, feedback, and support history
      </Link>
    </div>
  );
}

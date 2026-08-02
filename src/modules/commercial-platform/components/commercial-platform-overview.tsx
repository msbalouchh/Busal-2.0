import Link from "next/link";

import { COMMERCIAL_PLATFORM_ROUTES } from "@/modules/commercial-platform/constants/commercial-platform";
import type {
  CommercialDashboardWidgets,
  CommercialPlatformPermissions,
} from "@/modules/commercial-platform/types/commercial-platform-types";
import type { SalesActivityData } from "@/services/sales-crm.service";
import { formatSalesMoney } from "@/modules/sales-crm/utils/sales-utils";

interface CommercialPlatformOverviewProps {
  widgets: CommercialDashboardWidgets;
  permissions: CommercialPlatformPermissions;
  recentActivities: SalesActivityData[];
}

export function CommercialPlatformOverview({
  widgets,
  permissions,
  recentActivities,
}: CommercialPlatformOverviewProps) {
  const cards = [
    {
      label: "Customers",
      value: widgets.totalCustomers.toString(),
      href: COMMERCIAL_PLATFORM_ROUTES.customers,
      visible: permissions.canViewCustomers,
    },
    {
      label: "Open leads",
      value: widgets.openLeads.toString(),
      href: COMMERCIAL_PLATFORM_ROUTES.leads,
      visible: permissions.canViewLeads,
    },
    {
      label: "Pipeline value",
      value: formatSalesMoney(widgets.openOpportunityValuePence),
      href: COMMERCIAL_PLATFORM_ROUTES.crm,
      visible: permissions.canViewLeads,
    },
    {
      label: "Sent quotes",
      value: widgets.sentQuotes.toString(),
      href: COMMERCIAL_PLATFORM_ROUTES.quotes,
      visible: permissions.canViewQuotes,
    },
    {
      label: "Active contracts",
      value: widgets.activeContracts.toString(),
      href: COMMERCIAL_PLATFORM_ROUTES.contracts,
      visible: permissions.canViewContracts,
    },
    {
      label: "Projects in progress",
      value: widgets.inProgressProjects.toString(),
      href: COMMERCIAL_PLATFORM_ROUTES.projects,
      visible: permissions.canViewProjects,
    },
    {
      label: "At-risk accounts",
      value: widgets.atRiskAccounts.toString(),
      href: COMMERCIAL_PLATFORM_ROUTES.customerSuccess,
      visible: permissions.canViewCustomerSuccess,
    },
    {
      label: "Outstanding revenue",
      value: formatSalesMoney(widgets.outstandingRevenuePence),
      href: COMMERCIAL_PLATFORM_ROUTES.revenue,
      visible: permissions.canViewRevenue,
    },
    {
      label: "MRR",
      value: formatSalesMoney(widgets.mrrPence),
      href: COMMERCIAL_PLATFORM_ROUTES.revenue,
      visible: permissions.canViewRevenue,
    },
    {
      label: "ARR",
      value: formatSalesMoney(widgets.arrPence),
      href: COMMERCIAL_PLATFORM_ROUTES.revenue,
      visible: permissions.canViewRevenue,
    },
  ].filter((card) => card.visible);

  const quickActions = [
    {
      label: "New lead",
      href: COMMERCIAL_PLATFORM_ROUTES.leads,
      visible: permissions.canManageLeads,
    },
    {
      label: "Create quote",
      href: COMMERCIAL_PLATFORM_ROUTES.quotesModule,
      visible: permissions.canManageQuotes,
    },
    {
      label: "New contract",
      href: COMMERCIAL_PLATFORM_ROUTES.contractsModule,
      visible: permissions.canManageContracts,
    },
    {
      label: "View customers",
      href: COMMERCIAL_PLATFORM_ROUTES.customers,
      visible: permissions.canViewCustomers,
    },
  ].filter((action) => action.visible);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="hover:bg-muted/40 rounded-lg border p-4 transition-colors"
          >
            <p className="text-muted-foreground text-sm">{card.label}</p>
            <p className="text-2xl font-semibold">{card.value}</p>
          </Link>
        ))}
      </div>

      {quickActions.length > 0 ? (
        <div className="rounded-lg border p-4">
          <h2 className="mb-3 font-semibold">Quick actions</h2>
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="bg-primary text-primary-foreground rounded-md px-3 py-2 text-sm"
              >
                {action.label}
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      {permissions.canViewLeads ? (
        <div className="rounded-lg border p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="font-semibold">Recent activities</h2>
            <Link
              href={COMMERCIAL_PLATFORM_ROUTES.crm}
              className="text-primary text-sm hover:underline"
            >
              View CRM
            </Link>
          </div>
          {recentActivities.length === 0 ? (
            <p className="text-muted-foreground text-sm">No recent commercial activity.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {recentActivities.map((activity) => (
                <li key={activity.id}>
                  <span className="font-medium">{activity.title}</span>
                  <span className="text-muted-foreground">
                    {" "}
                    · {activity.activityType.replaceAll("_", " ")} ·{" "}
                    {new Date(activity.createdAt).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}

import Link from "next/link";

import { CRM_ROUTES } from "@/modules/crm/constants/routes";
import { COMMERCIAL_PLATFORM_ROUTES } from "@/modules/commercial-platform/constants/commercial-platform";
import type { CustomerView, CrmDashboardView } from "@/modules/crm/types/crm";

interface CommercialCustomersPanelProps {
  customers: CustomerView[];
  dashboard: CrmDashboardView;
}

export function CommercialCustomersPanel({ customers, dashboard }: CommercialCustomersPanelProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border p-4">
          <p className="text-muted-foreground text-sm">Total customers</p>
          <p className="text-2xl font-semibold">{dashboard.totalCustomers}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-muted-foreground text-sm">New (30 days)</p>
          <p className="text-2xl font-semibold">{dashboard.newCustomers}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-muted-foreground text-sm">Returning</p>
          <p className="text-2xl font-semibold">{dashboard.returningCustomers}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-muted-foreground text-sm">VIP</p>
          <p className="text-2xl font-semibold">{dashboard.vipCustomers}</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left">Customer</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Phone</th>
              <th className="px-4 py-3 text-left">Group</th>
              <th className="px-4 py-3 text-left">Profile</th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-muted-foreground px-4 py-8 text-center">
                  No customers found.
                </td>
              </tr>
            ) : (
              customers.map((customer) => (
                <tr key={customer.id} className="border-t">
                  <td className="px-4 py-3 font-medium">{customer.name}</td>
                  <td className="px-4 py-3">{customer.email ?? "—"}</td>
                  <td className="px-4 py-3">{customer.phone ?? "—"}</td>
                  <td className="px-4 py-3">{customer.groupName ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={CRM_ROUTES.customer(customer.id)}
                      className="text-primary hover:underline"
                    >
                      View profile
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Link
        href={COMMERCIAL_PLATFORM_ROUTES.crmModule}
        className="text-primary text-sm hover:underline"
      >
        Open full CRM module
      </Link>
    </div>
  );
}

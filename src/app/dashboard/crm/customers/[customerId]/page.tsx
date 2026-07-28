import Link from "next/link";

import { Button } from "@/components/ui/button";
import { CustomerDetailPanel } from "@/modules/crm/components/customer-detail-view";
import { CRM_ROUTES } from "@/modules/crm/constants/routes";
import { getCrmCustomerDetailContext } from "@/modules/crm/lib/get-crm-context";

export default async function CrmCustomerDetailPage({
  params,
}: {
  params: Promise<{ customerId: string }>;
}) {
  const { customerId } = await params;
  const data = await getCrmCustomerDetailContext(customerId);

  return (
    <div className="space-y-4">
      <Button asChild variant="outline">
        <Link href={CRM_ROUTES.customers}>Back to Customers</Link>
      </Button>
      <CustomerDetailPanel
        customer={data.customer}
        history={data.history}
        timeline={data.timeline}
        notes={data.notes}
        pointTransactions={data.pointTransactions}
        rewards={data.rewards}
      />
    </div>
  );
}

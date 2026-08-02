import type { Metadata } from "next";

import { PageContainer } from "@/components/common/page-container";
import { CustomerPortalNotificationsPanel } from "@/modules/customer-portal/components/customer-portal-notifications-panel";
import { getCustomerPortalContext } from "@/modules/customer-portal/lib/get-customer-portal-context";
import { listCustomerNotifications } from "@/services/customer-portal.service";

export const metadata: Metadata = {
  title: "Notifications",
};

export default async function CustomerPortalNotificationsPage() {
  const context = await getCustomerPortalContext();
  const notifications = await listCustomerNotifications(context.userId, context.business.id);

  return (
    <PageContainer title="Notifications" description="Updates and alerts from the business.">
      <CustomerPortalNotificationsPanel notifications={notifications} />
    </PageContainer>
  );
}

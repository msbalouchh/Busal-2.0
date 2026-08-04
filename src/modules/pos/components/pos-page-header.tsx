import type { PosOrderType } from "@/modules/pos/constants/routes";

import { DashboardPageHeading } from "@/components/layout/dashboard-page-heading";

interface PosPageHeaderProps {
  title: string;
  description: string;
}

export function PosPageHeader({ title, description }: PosPageHeaderProps) {
  return <DashboardPageHeading title={title} description={description} />;
}

export function getPosOrderTypeLabel(orderType: PosOrderType): string {
  switch (orderType) {
    case "TAKEAWAY":
      return "Takeaway";
    case "DELIVERY":
      return "Delivery";
    default:
      return "Dine In";
  }
}

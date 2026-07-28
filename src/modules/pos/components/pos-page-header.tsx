import type { PosOrderType } from "@/modules/pos/constants/routes";

interface PosPageHeaderProps {
  title: string;
  description: string;
}

export function PosPageHeader({ title, description }: PosPageHeaderProps) {
  return (
    <div className="space-y-1">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  );
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

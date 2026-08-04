import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ReservationSource } from "@/modules/reservations/constants/reservation-status";

interface ReservationSourceBadgeProps {
  source: ReservationSource;
  className?: string;
}

const SOURCE_LABEL: Record<ReservationSource, string> = {
  website: "Website",
  mobile_app: "Mobile App",
  qr: "QR",
  walk_in: "Walk-in",
  phone: "Phone",
  google: "Google",
  facebook: "Facebook",
  instagram: "Instagram",
  whatsapp: "WhatsApp",
  staff: "Staff",
};

export function ReservationSourceBadge({ source, className }: ReservationSourceBadgeProps) {
  return (
    <Badge variant="outline" className={cn("font-normal", className)}>
      {SOURCE_LABEL[source]}
    </Badge>
  );
}

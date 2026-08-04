import type { ReactNode } from "react";

import { DashboardSectionLayout } from "@/components/layout/dashboard-section-layout";

interface ReservationsLayoutProps {
  children: ReactNode;
}

export default function ReservationsLayout({ children }: ReservationsLayoutProps) {
  return (
    <DashboardSectionLayout description="Manage bookings, waitlists, and table assignments.">
      {children}
    </DashboardSectionLayout>
  );
}

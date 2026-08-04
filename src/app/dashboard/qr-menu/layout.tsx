import type { ReactNode } from "react";

import { DashboardSectionLayout } from "@/components/layout/dashboard-section-layout";

interface QRMenuLayoutProps {
  children: ReactNode;
}

export default function QRMenuLayout({ children }: QRMenuLayoutProps) {
  return (
    <DashboardSectionLayout description="Configure and manage QR code menus for guest ordering.">
      {children}
    </DashboardSectionLayout>
  );
}

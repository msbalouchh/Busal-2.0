import type { Metadata } from "next";

import { DashboardSectionLayout } from "@/components/layout/dashboard-section-layout";
import { NotificationsNav } from "@/modules/notifications/components/notifications-nav";

export const metadata: Metadata = {
  title: "Notification Hub",
};

export default function NotificationsLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardSectionLayout
      description="Centralized notification engine, templates, delivery rules, and inbox for all Busal modules."
      nav={<NotificationsNav />}
    >
      {children}
    </DashboardSectionLayout>
  );
}

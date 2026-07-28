import type { Metadata } from "next";

import { NotificationsNav } from "@/modules/notifications/components/notifications-nav";

export const metadata: Metadata = {
  title: "Notification Hub",
};

export default function NotificationsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Unified Notification Hub</h1>
        <p className="text-muted-foreground text-sm">
          Centralized notification engine, templates, delivery rules, and inbox for all Busal
          modules.
        </p>
      </div>
      <NotificationsNav />
      {children}
    </div>
  );
}

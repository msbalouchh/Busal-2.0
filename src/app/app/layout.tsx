import type { ReactNode } from "react";

import { ApplicationShell } from "@/components/layout/application-shell";
import { getApplicationShellNotifications } from "@/modules/application-shell/lib/get-application-shell-notifications";
import { requireApplicationAccess } from "@/modules/application-shell/lib/require-application-access";

interface ApplicationLayoutProps {
  children: ReactNode;
}

export const dynamic = "force-dynamic";

export default async function ApplicationLayout({ children }: ApplicationLayoutProps) {
  const user = await requireApplicationAccess();
  const notifications = await getApplicationShellNotifications();

  return (
    <ApplicationShell userName={user.fullName} userEmail={user.email} notifications={notifications}>
      {children}
    </ApplicationShell>
  );
}

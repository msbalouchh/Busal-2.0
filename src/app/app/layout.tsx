import type { ReactNode } from "react";

import { WorkspaceShell } from "@/modules/application-shell";
import { requireApplicationAccess } from "@/modules/application-shell/lib/require-application-access";

interface ApplicationLayoutProps {
  children: ReactNode;
}

export const dynamic = "force-dynamic";

export default async function ApplicationLayout({ children }: ApplicationLayoutProps) {
  const user = await requireApplicationAccess();

  return (
    <WorkspaceShell userName={user.fullName} userEmail={user.email}>
      {children}
    </WorkspaceShell>
  );
}

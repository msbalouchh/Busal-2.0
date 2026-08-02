import type { ReactNode } from "react";

import { ControlCenterShell } from "@/modules/control-center/components/control-center-shell";
import { ControlCenterProvider } from "@/modules/control-center/components/control-center-provider";
import { getControlCenterShellContext } from "@/modules/control-center/lib/get-control-center-context";

export const dynamic = "force-dynamic";

interface ControlCenterShellLayoutProps {
  children: ReactNode;
}

export default async function ControlCenterShellLayout({
  children,
}: ControlCenterShellLayoutProps) {
  const { operator, clientContext } = await getControlCenterShellContext();

  return (
    <ControlCenterProvider value={clientContext}>
      <ControlCenterShell operatorName={operator.fullName} operatorEmail={operator.email}>
        {children}
      </ControlCenterShell>
    </ControlCenterProvider>
  );
}

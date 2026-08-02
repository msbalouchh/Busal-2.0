import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

interface ControlCenterRootLayoutProps {
  children: ReactNode;
}

export default function ControlCenterRootLayout({ children }: ControlCenterRootLayoutProps) {
  return children;
}

import type { ReactNode } from "react";

interface KitchenLayoutProps {
  children: ReactNode;
}

export default function KitchenLayout({ children }: KitchenLayoutProps) {
  return <div className="flex min-h-full flex-1 flex-col p-4 sm:p-6">{children}</div>;
}

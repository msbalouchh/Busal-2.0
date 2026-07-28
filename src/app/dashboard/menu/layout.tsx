import type { ReactNode } from "react";

import { MenuNav } from "@/modules/menu/components/menu-nav";

interface MenuLayoutProps {
  children: ReactNode;
}

export default function MenuLayout({ children }: MenuLayoutProps) {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <MenuNav />
      {children}
    </div>
  );
}

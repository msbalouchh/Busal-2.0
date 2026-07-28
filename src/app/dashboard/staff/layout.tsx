import type { ReactNode } from "react";

import { StaffNav } from "@/modules/staff/components/staff-nav";

interface StaffLayoutProps {
  children: ReactNode;
}

export default function StaffLayout({ children }: StaffLayoutProps) {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <StaffNav />
      {children}
    </div>
  );
}

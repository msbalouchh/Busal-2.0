import type { ReactNode } from "react";

import { BusinessNav } from "@/modules/business/components/business-nav";

interface BusinessLayoutProps {
  children: ReactNode;
}

export default function BusinessLayout({ children }: BusinessLayoutProps) {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <BusinessNav />
      {children}
    </div>
  );
}

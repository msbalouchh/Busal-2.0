import type { ReactNode } from "react";

import { CommercialPlatformNav } from "@/modules/commercial-platform/components/commercial-platform-nav";

interface CommercialPlatformLayoutProps {
  children: ReactNode;
}

export default function CommercialPlatformLayout({ children }: CommercialPlatformLayoutProps) {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <CommercialPlatformNav />
      {children}
    </div>
  );
}

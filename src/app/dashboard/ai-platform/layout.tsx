import type { ReactNode } from "react";

import { AiPlatformNav } from "@/modules/ai-platform/components/ai-platform-nav";

interface AiPlatformLayoutProps {
  children: ReactNode;
}

export default function AiPlatformLayout({ children }: AiPlatformLayoutProps) {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <AiPlatformNav />
      {children}
    </div>
  );
}

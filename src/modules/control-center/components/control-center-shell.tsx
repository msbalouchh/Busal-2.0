"use client";

import type { ReactNode } from "react";

import { SkipToContent } from "@/components/common/skip-to-content";
import { ControlCenterHeader } from "@/modules/control-center/components/control-center-header";
import { ControlCenterSidebar } from "@/modules/control-center/components/control-center-sidebar";
import { useIsMobile } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/stores/sidebar.store";

interface ControlCenterShellProps {
  children: ReactNode;
  operatorName: string;
  operatorEmail: string;
}

export function ControlCenterShell({
  children,
  operatorName,
  operatorEmail,
}: ControlCenterShellProps) {
  const isMobile = useIsMobile();
  const { isOpen, isCollapsed } = useSidebarStore();

  const sidebarOffset = !isMobile ? (isCollapsed ? "lg:ml-16" : "lg:ml-64") : isOpen ? "ml-64" : "";

  return (
    <div className="bg-background min-h-screen">
      <SkipToContent />
      <ControlCenterSidebar />

      <div
        className={cn(
          "flex min-h-screen transition-[margin] duration-200 ease-in-out",
          sidebarOffset,
        )}
      >
        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <ControlCenterHeader operatorName={operatorName} operatorEmail={operatorEmail} />
          <main id="main-content" className="min-w-0 flex-1">
            {children}
          </main>
          <footer className="text-muted-foreground border-t px-4 py-3 text-xs">
            Busal Control Center · Super Admin Platform
          </footer>
        </div>

        <aside
          className="hidden w-72 shrink-0 border-l xl:block"
          aria-label="Utility panel"
          data-utility-panel="operator-context"
        >
          <div className="text-muted-foreground p-4 text-sm">
            Operator context for incidents, alerts, and platform workflows.
          </div>
        </aside>
      </div>
    </div>
  );
}

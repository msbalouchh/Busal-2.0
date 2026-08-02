"use client";

import type { ReactNode } from "react";

import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { useIsMobile } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/stores/sidebar.store";

interface DashboardShellProps {
  children: ReactNode;
  greeting: string;
  userEmail: string;
}

export function DashboardShell({ children, greeting, userEmail }: DashboardShellProps) {
  const isMobile = useIsMobile();
  const { isOpen, isCollapsed } = useSidebarStore();

  const sidebarOffset = !isMobile ? (isCollapsed ? "lg:ml-16" : "lg:ml-64") : isOpen ? "ml-64" : "";

  return (
    <div className="bg-background min-h-screen">
      <Sidebar />

      <div
        className={cn(
          "flex min-h-screen transition-[margin] duration-200 ease-in-out",
          sidebarOffset,
        )}
      >
        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <Header greeting={greeting} userEmail={userEmail} />
          <main className="flex-1">{children}</main>
          <footer className="text-muted-foreground border-t px-4 py-3 text-xs">
            Busal OS · Production Dashboard Foundation
          </footer>
        </div>

        <aside
          className="hidden w-72 shrink-0 border-l xl:block"
          aria-label="Utility panel"
          data-utility-panel="future-ready"
        >
          <div className="text-muted-foreground p-4 text-sm">
            Utility panel reserved for contextual tools, AI copilots, and module extensions.
          </div>
        </aside>
      </div>
    </div>
  );
}

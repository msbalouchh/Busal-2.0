"use client";

import type { ReactNode } from "react";

import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { useIsMobile } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/stores/sidebar.store";

interface DashboardShellProps {
  children: ReactNode;
  title?: string;
}

export function DashboardShell({ children, title }: DashboardShellProps) {
  const isMobile = useIsMobile();
  const isOpen = useSidebarStore((state) => state.isOpen);

  return (
    <div className="bg-background min-h-screen">
      <Sidebar />
      <div
        className={cn(
          "flex min-h-screen flex-col transition-[margin] duration-200 ease-in-out",
          !isMobile && isOpen ? "ml-64" : "",
        )}
      >
        <Header title={title} />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}

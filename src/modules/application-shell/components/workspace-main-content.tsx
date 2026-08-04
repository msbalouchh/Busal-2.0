"use client";

import type { ReactNode } from "react";

import { PageContainer } from "@/components/common/page-container";
import { SidebarInset } from "@/components/navigation";
import { motion } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { PageTransition } from "@/modules/application-shell/components/page-transition";

interface WorkspaceMainContentProps {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

export function WorkspaceMainContent({
  children,
  className,
  contentClassName,
}: WorkspaceMainContentProps) {
  return (
    <SidebarInset className={cn("flex min-w-0 flex-col pt-14", motion.transition, className)}>
      <main
        id="main-content"
        className={cn("min-h-[calc(100vh-3.5rem)] w-full min-w-0 flex-1", contentClassName)}
        tabIndex={-1}
      >
        <PageTransition className="w-full min-w-0">
          <PageContainer className="gap-6 p-4 sm:gap-6 sm:p-6 lg:p-8">{children}</PageContainer>
        </PageTransition>
      </main>
    </SidebarInset>
  );
}

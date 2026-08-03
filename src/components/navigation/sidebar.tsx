"use client";

import { ChevronLeft, ChevronRight, Menu, X } from "lucide-react";
import { useEffect, type ReactNode } from "react";

import { useNavigationSidebar } from "@/components/navigation/navigation-sidebar-context";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface SidebarProps {
  children: ReactNode;
  brand?: ReactNode;
  footer?: ReactNode;
  className?: string;
  "aria-label"?: string;
}

export function Sidebar({
  children,
  brand,
  footer,
  className,
  "aria-label": ariaLabel,
}: SidebarProps) {
  const { isOpen, isCollapsed, isMobile, close, toggleCollapsed } = useNavigationSidebar();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isMobile && isOpen) {
        close();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [close, isMobile, isOpen]);

  const widthClass = isMobile ? "w-64" : isCollapsed ? "w-16" : "w-64";

  return (
    <>
      {isMobile && isOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50"
          onClick={close}
          aria-label="Close sidebar overlay"
        />
      ) : null}

      <aside
        className={cn(
          "bg-sidebar text-sidebar-foreground border-sidebar-border fixed inset-y-0 left-0 z-50 flex flex-col border-r transition-all duration-200 ease-in-out",
          widthClass,
          isMobile ? (isOpen ? "translate-x-0" : "-translate-x-full") : "translate-x-0",
          className,
        )}
        aria-label={ariaLabel ?? "Sidebar navigation"}
      >
        <div className="flex h-14 items-center justify-between px-3">
          <div
            className={cn(
              "flex min-w-0 flex-1 items-center gap-2",
              !isMobile && isCollapsed && "justify-center",
            )}
          >
            {brand}
          </div>

          {isMobile ? (
            <Button variant="ghost" size="icon" onClick={close} aria-label="Close sidebar">
              <X className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleCollapsed}
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="hidden shrink-0 lg:inline-flex"
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>

        <Separator />

        <ScrollArea className="flex-1 px-2 py-4">
          <nav aria-label="Sidebar">{children}</nav>
        </ScrollArea>

        {footer ? (
          <>
            <Separator />
            <div className="p-3">{footer}</div>
          </>
        ) : null}
      </aside>
    </>
  );
}

export function SidebarContent({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const { isCollapsed, isMobile } = useNavigationSidebar();

  return (
    <div
      className={cn("space-y-4", className)}
      data-sidebar-collapsed={!isMobile && isCollapsed ? "true" : "false"}
    >
      {children}
    </div>
  );
}

export function SidebarTrigger({ className }: { className?: string }) {
  const { toggle } = useNavigationSidebar();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label="Toggle sidebar"
      className={className}
    >
      <Menu className="h-4 w-4" />
    </Button>
  );
}

export function SidebarInset({ children, className }: { children: ReactNode; className?: string }) {
  const { isCollapsed, isMobile } = useNavigationSidebar();

  const insetClass = isMobile
    ? "w-full"
    : isCollapsed
      ? "ml-16 w-[calc(100%-4rem)]"
      : "ml-64 w-[calc(100%-16rem)]";

  return (
    <div
      className={cn(
        "min-h-screen min-w-0 transition-[margin,width] duration-200 ease-in-out",
        insetClass,
        className,
      )}
    >
      {children}
    </div>
  );
}

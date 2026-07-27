"use client";

import { LayoutDashboard, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { siteConfig } from "@/config/site";
import { ROUTES } from "@/constants/routes";
import { useIsMobile } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/stores/sidebar.store";

const navigation = [{ name: "Dashboard", href: ROUTES.dashboard, icon: LayoutDashboard }] as const;

export function Sidebar() {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const { isOpen, close, setMobile } = useSidebarStore();

  useEffect(() => {
    setMobile(isMobile);
  }, [isMobile, setMobile]);

  useEffect(() => {
    if (isMobile) {
      close();
    }
  }, [pathname, isMobile, close]);

  return (
    <>
      {isMobile && isOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50"
          onClick={close}
          aria-label="Close sidebar"
        />
      ) : null}

      <aside
        className={cn(
          "bg-sidebar text-sidebar-foreground border-sidebar-border fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r transition-transform duration-200 ease-in-out",
          isMobile ? (isOpen ? "translate-x-0" : "-translate-x-full") : "translate-x-0",
        )}
        aria-label="Main navigation"
      >
        <div className="flex h-14 items-center justify-between px-4">
          <Link href={ROUTES.home} className="flex items-center gap-2 font-semibold">
            <span className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-md text-sm">
              B
            </span>
            <span>{siteConfig.name}</span>
          </Link>
          {isMobile ? (
            <Button variant="ghost" size="icon" onClick={close} aria-label="Close menu">
              <X className="h-4 w-4" />
            </Button>
          ) : null}
        </div>

        <Separator />

        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50",
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </ScrollArea>
      </aside>
    </>
  );
}

export function SidebarTrigger() {
  const { toggle } = useSidebarStore();

  return (
    <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle sidebar">
      <Menu className="h-4 w-4" />
    </Button>
  );
}

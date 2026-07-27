"use client";

import { Bell } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/layout/sidebar";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { useIsMobile } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/stores/sidebar.store";

interface HeaderProps {
  title?: string;
}

export function Header({ title = "Dashboard" }: HeaderProps) {
  const isMobile = useIsMobile();
  const isOpen = useSidebarStore((state) => state.isOpen);

  return (
    <header
      className={cn(
        "bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-30 flex h-14 items-center gap-4 border-b px-4 backdrop-blur",
        !isMobile && isOpen ? "ml-64" : !isMobile ? "ml-0" : "",
      )}
    >
      <SidebarTrigger />
      <Separator orientation="vertical" className="h-6" />
      <h1 className="flex-1 text-sm font-medium">{title}</h1>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="h-4 w-4" />
        </Button>
        <ThemeToggle />
      </div>
    </header>
  );
}

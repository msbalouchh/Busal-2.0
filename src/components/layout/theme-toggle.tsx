"use client";

import { ChevronLeft, ChevronRight, Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSidebarStore } from "@/stores/sidebar.store";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" disabled aria-label="Theme settings">
        <Sun className="h-4 w-4" />
      </Button>
    );
  }

  const currentTheme = theme ?? "system";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Theme settings">
          {currentTheme === "dark" ? (
            <Moon className="h-4 w-4" />
          ) : currentTheme === "light" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Monitor className="h-4 w-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Theme</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={currentTheme} onValueChange={setTheme}>
          <DropdownMenuRadioItem value="light">
            <Sun className="mr-2 h-4 w-4" />
            Light
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">
            <Moon className="mr-2 h-4 w-4" />
            Dark
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system">
            <Monitor className="mr-2 h-4 w-4" />
            System
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function SidebarCollapseButton() {
  const { isCollapsed, toggleCollapsed, isMobile } = useSidebarStore();

  if (isMobile) {
    return null;
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleCollapsed}
      aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      className="hidden lg:inline-flex"
    >
      {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
    </Button>
  );
}

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { useIsMobile } from "@/hooks/use-media-query";

interface NavigationSidebarContextValue {
  isOpen: boolean;
  isCollapsed: boolean;
  isMobile: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  toggleCollapsed: () => void;
}

const NavigationSidebarContext = createContext<NavigationSidebarContextValue | null>(null);

interface NavigationSidebarProviderProps {
  children: ReactNode;
  defaultOpen?: boolean;
  defaultCollapsed?: boolean;
}

export function NavigationSidebarProvider({
  children,
  defaultOpen = true,
  defaultCollapsed = false,
}: NavigationSidebarProviderProps) {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  useEffect(() => {
    if (isMobile) {
      setIsOpen(false);
      setIsCollapsed(false);
      return;
    }

    setIsOpen(true);
  }, [isMobile]);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((value) => !value), []);
  const toggleCollapsed = useCallback(() => setIsCollapsed((value) => !value), []);

  const value = useMemo(
    () => ({
      isOpen,
      isCollapsed,
      isMobile,
      open,
      close,
      toggle,
      toggleCollapsed,
    }),
    [isOpen, isCollapsed, isMobile, open, close, toggle, toggleCollapsed],
  );

  return (
    <NavigationSidebarContext.Provider value={value}>{children}</NavigationSidebarContext.Provider>
  );
}

export function useNavigationSidebar(): NavigationSidebarContextValue {
  const context = useContext(NavigationSidebarContext);

  if (!context) {
    throw new Error("useNavigationSidebar must be used within NavigationSidebarProvider");
  }

  return context;
}

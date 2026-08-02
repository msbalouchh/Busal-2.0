"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

import { getDashboardNavGroups } from "@/modules/dashboard/constants/navigation";
import { filterDashboardNavigation } from "@/modules/dashboard/lib/filter-navigation";
import type {
  ClientDashboardContext,
  DashboardNavGroup,
} from "@/modules/dashboard/types/dashboard";

interface DashboardContextValue extends ClientDashboardContext {
  navigation: DashboardNavGroup[];
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

interface DashboardProviderProps {
  children: ReactNode;
  value: ClientDashboardContext;
}

export function DashboardProvider({ children, value }: DashboardProviderProps) {
  const navigation = useMemo(
    () =>
      filterDashboardNavigation(getDashboardNavGroups(), {
        permissions: value.permissions,
        featureFlags: value.featureFlags,
        isOwner: value.isOwner,
      }),
    [value.featureFlags, value.isOwner, value.permissions],
  );

  const contextValue = useMemo(
    () => ({
      ...value,
      navigation,
    }),
    [navigation, value],
  );

  return <DashboardContext.Provider value={contextValue}>{children}</DashboardContext.Provider>;
}

export function useDashboardContext(): DashboardContextValue {
  const context = useContext(DashboardContext);

  if (!context) {
    throw new Error("useDashboardContext must be used within DashboardProvider");
  }

  return context;
}

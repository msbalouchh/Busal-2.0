"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

import { filterControlCenterNavigation } from "@/modules/control-center/lib/filter-control-center-navigation";
import type {
  ClientControlCenterContext,
  ControlCenterNavGroup,
} from "@/modules/control-center/types/control-center-types";

interface ControlCenterContextValue extends ClientControlCenterContext {
  navigation: ControlCenterNavGroup[];
}

const ControlCenterContext = createContext<ControlCenterContextValue | null>(null);

interface ControlCenterProviderProps {
  children: ReactNode;
  value: ClientControlCenterContext;
}

export function ControlCenterProvider({ children, value }: ControlCenterProviderProps) {
  const navigation = useMemo(
    () => filterControlCenterNavigation(value.permissions, value.featureFlags),
    [value.featureFlags, value.permissions],
  );

  const contextValue = useMemo(
    () => ({
      ...value,
      navigation,
    }),
    [navigation, value],
  );

  return (
    <ControlCenterContext.Provider value={contextValue}>{children}</ControlCenterContext.Provider>
  );
}

export function useControlCenterContext(): ControlCenterContextValue {
  const context = useContext(ControlCenterContext);

  if (!context) {
    throw new Error("useControlCenterContext must be used within ControlCenterProvider");
  }

  return context;
}

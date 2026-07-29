"use client";

/**
 * Busal OS Theme Context
 * ----------------------
 * React context that exposes the current theme state via `useTheme()`.
 * The provider lives in `theme-provider.tsx`.
 */
import { createContext, useContext } from "react";

import type { ThemeContextValue } from "@/lib/theme/theme-types";

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeContextProvider({
  value,
  children,
}: {
  value: ThemeContextValue;
  children: React.ReactNode;
}) {
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/** Access the theme system. Throws if used outside the provider. */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a BusalThemeProvider");
  }
  return ctx;
}

export { ThemeContext };

"use client";

/**
 * Busal OS Theme Provider
 * -----------------------
 * Centralized, dark-first theme architecture.
 *
 * Responsibilities:
 *  - Hold the selected appearance mode (`dark` | `light` | `system`).
 *  - Resolve `system` against the live OS `prefers-color-scheme` preference.
 *  - Apply the resolved theme class to `<html>` instantly on change.
 *  - Persist the user's choice to localStorage.
 *  - React to OS preference changes while in `system` mode.
 *  - Expose a stable `useTheme()` API to every module.
 *
 * Dark is the default experience; light provides identical functionality.
 *
 * NOTE: This provider is self-contained and does NOT replace the existing
 * `src/providers/theme-provider.tsx` shim (which wraps next-themes). It is the
 * canonical theme runtime for the Busal theme system. Wire it into the app
 * tree in a future step by replacing the shim — that wiring is out of scope
 * for the theme-foundation task.
 */
import { useCallback, useEffect, useMemo, useState } from "react";

import { DEFAULT_RESOLVED_THEME } from "@/lib/design-tokens/theme-tokens";
import type { ResolvedTheme, SystemPreference, ThemeMode } from "@/lib/design-tokens/theme-tokens";
import { THEME_CONFIG } from "@/lib/theme/theme-config";
import { ThemeContextProvider } from "@/lib/theme/theme-context";

import type { ThemeContextValue, ThemeProviderProps } from "@/lib/theme/theme-types";
import {
  applyThemeToDom,
  getStoredTheme,
  getSystemPreference,
  onSystemPreferenceChange,
  resolveTheme,
  storeTheme,
} from "@/lib/theme/theme-utils";

export function BusalThemeProvider({
  children,
  defaultTheme = THEME_CONFIG.defaultTheme,
  storageKey: _storageKey = THEME_CONFIG.storageKey,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeMode>(defaultTheme);
  const [systemPreference, setSystemPreference] = useState<SystemPreference | null>(null);
  const [mounted, setMounted] = useState(false);

  // On mount: hydrate from storage + read live OS preference.
  useEffect(() => {
    const stored = getStoredTheme();
    const pref = getSystemPreference();
    setThemeState(stored);
    setSystemPreference(pref);
    setMounted(true);
  }, []);

  // Apply the resolved theme to the DOM whenever it changes.
  const resolvedTheme: ResolvedTheme = useMemo(
    () => resolveTheme(theme, systemPreference ?? DEFAULT_RESOLVED_THEME),
    [theme, systemPreference],
  );

  useEffect(() => {
    if (mounted) applyThemeToDom(resolvedTheme);
  }, [resolvedTheme, mounted]);

  // Listen to OS preference changes (drives `system` mode).
  useEffect(() => {
    if (!mounted) return;
    const unsubscribe = onSystemPreferenceChange((pref) => setSystemPreference(pref));
    return unsubscribe;
  }, [mounted]);

  // Public setter: update state, persist, and apply immediately.
  const setTheme = useCallback((next: ThemeMode) => {
    setThemeState(next);
    storeTheme(next);
    const pref = getSystemPreference();
    setSystemPreference(pref);
    applyThemeToDom(resolveTheme(next, pref));
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, resolvedTheme, systemPreference, setTheme, mounted }),
    [theme, resolvedTheme, systemPreference, setTheme, mounted],
  );

  return <ThemeContextProvider value={value}>{children}</ThemeContextProvider>;
}

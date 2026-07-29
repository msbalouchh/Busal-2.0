/**
 * Pure theme utility functions — no React, no side effects beyond the DOM
 * helpers that are explicitly documented. Safe to call from client code.
 */
import { THEME_CONFIG } from "@/lib/theme/theme-config";
import {
  DEFAULT_RESOLVED_THEME,
  RESOLVED_THEMES,
  THEME_CLASSES,
} from "@/lib/design-tokens/theme-tokens";
import type { ResolvedTheme, SystemPreference, ThemeMode } from "@/lib/design-tokens/theme-tokens";

/* -------------------------------------------------------------------------- */
/*  OS preference                                                             */
/* -------------------------------------------------------------------------- */

/** Read the live OS colour-scheme preference. Returns `dark` by default. */
export function getSystemPreference(): SystemPreference {
  if (typeof window === "undefined") return DEFAULT_RESOLVED_THEME;
  return window.matchMedia(THEME_CONFIG.mediaQuery).matches ? "dark" : "light";
}

/** Attach a listener to OS preference changes. Returns an unsubscribe fn. */
export function onSystemPreferenceChange(callback: (pref: SystemPreference) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const mql = window.matchMedia(THEME_CONFIG.mediaQuery);
  const handler = (e: MediaQueryListEvent) => callback(e.matches ? "dark" : "light");
  mql.addEventListener("change", handler);
  return () => mql.removeEventListener("change", handler);
}

/* -------------------------------------------------------------------------- */
/*  Resolution                                                                */
/* -------------------------------------------------------------------------- */

/** Resolve a user-selected mode to the concrete theme applied to the DOM. */
export function resolveTheme(mode: ThemeMode, systemPreference: SystemPreference): ResolvedTheme {
  if (mode === "system") return systemPreference;
  return mode;
}

/** Whether a resolved theme is dark (used by the Tailwind `dark:` variant). */
export function isDarkTheme(resolved: ResolvedTheme): boolean {
  return resolved === "dark";
}

/* -------------------------------------------------------------------------- */
/*  DOM application                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Apply a resolved theme to `<html>` by setting the `dark`/`light` class and
 * the `color-scheme` property. Removes the opposite class so only one is
 * present at a time. Idempotent.
 */
export function applyThemeToDom(resolved: ResolvedTheme): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const active = isDarkTheme(resolved)
    ? THEME_CONFIG.darkSelectorClass
    : THEME_CONFIG.lightSelectorClass;
  const inactive = isDarkTheme(resolved)
    ? THEME_CONFIG.lightSelectorClass
    : THEME_CONFIG.darkSelectorClass;

  root.classList.add(active);
  root.classList.remove(inactive);
  root.style.colorScheme = resolved;
}

/* -------------------------------------------------------------------------- */
/*  Persistence                                                               */
/* -------------------------------------------------------------------------- */

/** Read the persisted theme mode from localStorage, falling back to default. */
export function getStoredTheme(): ThemeMode {
  if (typeof window === "undefined") return THEME_CONFIG.defaultTheme;
  const raw = window.localStorage.getItem(THEME_CONFIG.storageKey);
  return raw === "dark" || raw === "light" || raw === "system" ? raw : THEME_CONFIG.defaultTheme;
}

/** Persist a theme mode to localStorage. */
export function storeTheme(theme: ThemeMode): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(THEME_CONFIG.storageKey, theme);
}

/* -------------------------------------------------------------------------- */
/*  Helpers for UI                                                            */
/* -------------------------------------------------------------------------- */

/** CSS class for a given mode (see THEME_CLASSES). */
export function themeClassFor(mode: ThemeMode): string {
  return THEME_CLASSES[mode];
}

/** All supported resolved themes, for iteration/testing. */
export function resolvedThemes(): readonly ResolvedTheme[] {
  return RESOLVED_THEMES;
}

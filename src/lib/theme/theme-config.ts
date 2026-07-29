/**
 * Runtime configuration for the Busal OS theme system.
 * Centralizes constants so behaviour is predictable and overridable.
 */
import { DEFAULT_THEME_MODE } from "@/lib/design-tokens/theme-tokens";
import type { ThemeMode } from "@/lib/design-tokens/theme-tokens";

export const THEME_CONFIG = {
  /** localStorage key for the persisted appearance mode. */
  storageKey: "busal-theme",
  /** Media query used to detect the OS colour-scheme preference. */
  mediaQuery: "(prefers-color-scheme: dark)",
  /** Mode applied when nothing is stored / on first paint. Dark-first. */
  defaultTheme: DEFAULT_THEME_MODE,
  /** The attribute the Tailwind `dark:` variant is keyed on. */
  darkSelectorClass: "dark",
  /** The class used for the light theme. */
  lightSelectorClass: "light",
} as const;

export type ThemeConfig = typeof THEME_CONFIG;

/** Validate that an arbitrary string is a supported theme mode. */
export function isValidThemeMode(value: unknown): value is ThemeMode {
  return value === "dark" || value === "light" || value === "system";
}

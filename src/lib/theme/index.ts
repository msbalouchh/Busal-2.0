/**
 * Barrel export for the Busal OS theme system.
 *
 * Import from `@/lib/theme`:
 *   import { BusalThemeProvider, useTheme } from "@/lib/theme";
 */
export { BusalThemeProvider } from "@/lib/theme/theme-provider";
export { useTheme, ThemeContext, ThemeContextProvider } from "@/lib/theme/theme-context";
export { buildThemeInitScript } from "@/lib/theme/theme-script";
export {
  getSystemPreference,
  onSystemPreferenceChange,
  resolveTheme,
  isDarkTheme,
  applyThemeToDom,
  getStoredTheme,
  storeTheme,
  themeClassFor,
  resolvedThemes,
} from "@/lib/theme/theme-utils";
export { THEME_CONFIG, isValidThemeMode } from "@/lib/theme/theme-config";
export type {
  ThemeContextValue,
  ThemeProviderProps,
  ResolvedTheme,
  SystemPreference,
  ThemeMode,
} from "@/lib/theme/theme-types";

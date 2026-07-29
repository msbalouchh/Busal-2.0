/**
 * Barrel export for the Busal OS design-token layer used by the theme system.
 *
 * Import from `@/lib/design-tokens`:
 *   import { THEME_MODES, type ThemeMode, colorVar } from "@/lib/design-tokens";
 */
export {
  THEME_MODES,
  RESOLVED_THEMES,
  DEFAULT_THEME_MODE,
  DEFAULT_RESOLVED_THEME,
  THEME_CLASSES,
  THEME_MODE_LABELS,
  type ThemeMode,
  type ResolvedTheme,
  type SystemPreference,
} from "./theme-tokens";

export {
  COLOR_TOKENS,
  colorVar,
  tokensByCategory,
  type ColorTokenName,
  type ColorTokenCategory,
  type ColorTokenDefinition,
} from "./color-tokens";

/**
 * Busal OS Theme Mode Tokens
 * --------------------------
 * Declarative definitions for the three appearance modes the theme system
 * supports: `dark` (default), `light`, and `system` (follows the OS preference).
 *
 * These are pure definitions — no runtime behaviour. Runtime config (storage
 * key, media query) lives in `src/lib/theme/theme-config.ts`.
 */

/** Appearance modes the user can select. */
export const THEME_MODES = ["dark", "light", "system"] as const;
export type ThemeMode = (typeof THEME_MODES)[number];

/** Concrete theme that gets applied to the DOM. `system` resolves to one of these. */
export const RESOLVED_THEMES = ["dark", "light"] as const;
export type ResolvedTheme = (typeof RESOLVED_THEMES)[number];

/** The OS-level preference, derived from `prefers-color-scheme`. */
export type SystemPreference = ResolvedTheme;

/** Dark is the primary, default experience. */
export const DEFAULT_THEME_MODE: ThemeMode = "dark";
export const DEFAULT_RESOLVED_THEME: ResolvedTheme = "dark";

/**
 * CSS class applied to `<html>` for each mode. `system` is resolved to
 * `dark`/`light` before being applied, so the DOM always carries a resolved
 * class — this keeps the Tailwind `dark:` variant reliable.
 */
export const THEME_CLASSES = {
  dark: "dark",
  light: "light",
  system: "system",
} as const satisfies Record<ThemeMode, string>;

/** Human-readable labels for display in future UI (e.g. a switcher). */
export const THEME_MODE_LABELS: Record<ThemeMode, string> = {
  dark: "Dark",
  light: "Light",
  system: "System",
};

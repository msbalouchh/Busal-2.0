/**
 * Busal OS Design Token Foundation
 * ---------------------------------
 * Single source of truth for design tokens, mirrored from the CSS custom
 * properties defined in `src/app/globals.css`.
 *
 * Use these constants for programmatic access where Tailwind utilities are not
 * available (charts, canvas, PDF rendering, inline styles, native components).
 * In markup, always prefer the matching Tailwind utility (e.g. `bg-surface`,
 * `text-text-muted`, `shadow-md`, `duration-fast`) so that theme switching and
 * dark/light mode resolve automatically.
 *
 * Rules:
 *  - Never hardcode colour values inside components. Always consume a token.
 *  - Dark mode is the default theme; light mode is fully supported.
 *  - Semantic names only — no raw palette hues in application code.
 */

/* -------------------------------------------------------------------------- */
/*                                  Colors                                    */
/* -------------------------------------------------------------------------- */

/**
 * Semantic colour tokens. Values reference the CSS variables so they stay in
 * sync with the active theme. Each resolves to an HSL triplet string.
 */
export const colors = {
  background: "hsl(var(--background))",
  foreground: "hsl(var(--foreground))",

  surface: "hsl(var(--surface))",
  surfaceForeground: "hsl(var(--surface-foreground))",

  card: "hsl(var(--card))",
  cardForeground: "hsl(var(--card-foreground))",

  popover: "hsl(var(--popover))",
  popoverForeground: "hsl(var(--popover-foreground))",

  primary: "hsl(var(--primary))",
  primaryForeground: "hsl(var(--primary-foreground))",

  secondary: "hsl(var(--secondary))",
  secondaryForeground: "hsl(var(--secondary-foreground))",

  muted: "hsl(var(--muted))",
  mutedForeground: "hsl(var(--muted-foreground))",

  accent: "hsl(var(--accent))",
  accentForeground: "hsl(var(--accent-foreground))",

  border: "hsl(var(--border))",
  input: "hsl(var(--input))",
  ring: "hsl(var(--ring))",

  /** Primary text colour (alias of foreground). */
  text: "hsl(var(--text))",
  textMuted: "hsl(var(--text-muted))",
  textSubtle: "hsl(var(--text-subtle))",
  textInverse: "hsl(var(--text-inverse))",

  success: "hsl(var(--success))",
  successForeground: "hsl(var(--success-foreground))",

  warning: "hsl(var(--warning))",
  warningForeground: "hsl(var(--warning-foreground))",

  error: "hsl(var(--error))",
  errorForeground: "hsl(var(--error-foreground))",

  /** Kept for shadcn/ui compatibility; mirrors `error`. */
  destructive: "hsl(var(--destructive))",
  destructiveForeground: "hsl(var(--destructive-foreground))",

  info: "hsl(var(--info))",
  infoForeground: "hsl(var(--info-foreground))",

  sidebar: "hsl(var(--sidebar))",
  sidebarForeground: "hsl(var(--sidebar-foreground))",
  sidebarBorder: "hsl(var(--sidebar-border))",
  sidebarAccent: "hsl(var(--sidebar-accent))",
  sidebarAccentForeground: "hsl(var(--sidebar-accent-foreground))",

  /** AI gradient stops. */
  aiFrom: "hsl(var(--ai-from))",
  aiVia: "hsl(var(--ai-via))",
  aiTo: "hsl(var(--ai-to))",
  /** Ready-to-use AI gradient image. */
  aiGradient: "linear-gradient(135deg, hsl(var(--ai-from)), hsl(var(--ai-via)), hsl(var(--ai-to)))",
} as const;

export type ColorToken = keyof typeof colors;

/* -------------------------------------------------------------------------- */
/*                                Typography                                  */
/* -------------------------------------------------------------------------- */

export const fonts = {
  sans: "var(--font-sans), ui-sans-serif, system-ui, sans-serif",
  mono: "var(--font-mono), ui-monospace, SFMono-Regular, monospace",
} as const;

export const fontSizes = {
  xs: "var(--text-xs)",
  sm: "var(--text-sm)",
  base: "var(--text-base)",
  lg: "var(--text-lg)",
  xl: "var(--text-xl)",
  "2xl": "var(--text-2xl)",
  "3xl": "var(--text-3xl)",
  "4xl": "var(--text-4xl)",
  "5xl": "var(--text-5xl)",
  "6xl": "var(--text-6xl)",
} as const;

export const fontWeights = {
  normal: "var(--font-weight-normal)",
  medium: "var(--font-weight-medium)",
  semibold: "var(--font-weight-semibold)",
  bold: "var(--font-weight-bold)",
} as const;

export const lineHeights = {
  tight: "var(--leading-tight)",
  snug: "var(--leading-snug)",
  normal: "var(--leading-normal)",
  relaxed: "var(--leading-relaxed)",
} as const;

/* -------------------------------------------------------------------------- */
/*                                  Spacing                                   */
/* -------------------------------------------------------------------------- */

/**
 * Named spacing scale on an 8px rhythm. Maps to Tailwind utilities such as
 * `p-xs`, `gap-md`, `mt-xl` (defined via `--spacing-*` in the theme).
 */
export const spacing = {
  xs: "var(--spacing-xs)",
  sm: "var(--spacing-sm)",
  md: "var(--spacing-md)",
  lg: "var(--spacing-lg)",
  xl: "var(--spacing-xl)",
  "2xl": "var(--spacing-2xl)",
  "3xl": "var(--spacing-3xl)",
  "4xl": "var(--spacing-4xl)",
} as const;

/** Pixel reference for the 4/8/16/24/32/48/64/96 scale. */
export const spacingPx = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  "2xl": 48,
  "3xl": 64,
  "4xl": 96,
} as const;

/* -------------------------------------------------------------------------- */
/*                                  Radius                                    */
/* -------------------------------------------------------------------------- */

export const radius = {
  sm: "var(--radius-sm)",
  md: "var(--radius-md)",
  lg: "var(--radius-lg)",
  xl: "var(--radius-xl)",
  full: "var(--radius-full)",
} as const;

/* -------------------------------------------------------------------------- */
/*                                  Shadows                                   */
/* -------------------------------------------------------------------------- */

export const shadows = {
  sm: "var(--shadow-sm)",
  md: "var(--shadow-md)",
  lg: "var(--shadow-lg)",
  xl: "var(--shadow-xl)",
} as const;

/* -------------------------------------------------------------------------- */
/*                                  Motion                                    */
/* -------------------------------------------------------------------------- */

export const duration = {
  instant: "var(--duration-instant)",
  fast: "var(--duration-fast)",
  normal: "var(--duration-normal)",
  slow: "var(--duration-slow)",
} as const;

export const easing = {
  linear: "var(--ease-linear)",
  out: "var(--ease-out)",
  inOut: "var(--ease-in-out)",
  spring: "var(--ease-spring)",
} as const;

/* -------------------------------------------------------------------------- */
/*                                Breakpoints                                 */
/* -------------------------------------------------------------------------- */

export const breakpoints = {
  mobile: "var(--breakpoint-mobile)",
  tablet: "var(--breakpoint-tablet)",
  laptop: "var(--breakpoint-laptop)",
  desktop: "var(--breakpoint-desktop)",
  wide: "var(--breakpoint-wide)",
} as const;

/** Pixel reference for the responsive scale. */
export const breakpointsPx = {
  mobile: 0,
  tablet: 640,
  laptop: 1024,
  desktop: 1280,
  wide: 1536,
} as const;

/* ------------------------------------------------------------------ */
/*                              Z-index                              */
/* ------------------------------------------------------------------ */

export const zIndex = {
  base: "var(--z-index-base)",
  dropdown: "var(--z-index-dropdown)",
  sticky: "var(--z-index-sticky)",
  overlay: "var(--z-index-overlay)",
  popover: "var(--z-index-popover)",
  modal: "var(--z-index-modal)",
  toast: "var(--z-index-toast)",
  tooltip: "var(--z-index-tooltip)",
} as const;

/* ------------------------------------------------------------------ */
/*                          Aggregated export                        */
/* ------------------------------------------------------------------ */

/**
 * Aggregated design token registry. Import as `designTokens` for a single
 * entry point, or import individual scales (e.g. `colors`, `radius`).
 */
export const designTokens = {
  colors,
  fonts,
  fontSizes,
  fontWeights,
  lineHeights,
  spacing,
  spacingPx,
  radius,
  shadows,
  duration,
  easing,
  breakpoints,
  breakpointsPx,
  zIndex,
} as const;

export type DesignTokens = typeof designTokens;

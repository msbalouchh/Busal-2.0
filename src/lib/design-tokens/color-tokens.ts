/**
 * Busal OS Semantic Color Token Registry
 * --------------------------------------
 * Structural map of every semantic color token: its CSS variable name and the
 * category it belongs to. The concrete HSL values live in `globals.css`
 * (dark under `:root`/`.dark`, light under `.light`); this module describes
 * the *shape* of the token system for tooling, validation, and programmatic
 * lookups.
 *
 * For value mirrors (e.g. `hsl(var(--background))`), see `src/styles/tokens.ts`.
 */

export type ColorTokenCategory =
  "surface" | "brand" | "text" | "line" | "status" | "sidebar" | "ai";

export interface ColorTokenDefinition {
  /** CSS custom property name (without `hsl()` wrapper). */
  cssVar: string;
  category: ColorTokenCategory;
  description: string;
}

export const COLOR_TOKENS = {
  // Surface
  background: { cssVar: "--background", category: "surface", description: "App canvas" },
  foreground: {
    cssVar: "--foreground",
    category: "surface",
    description: "Default content on background",
  },
  surface: { cssVar: "--surface", category: "surface", description: "Raised neutral surface" },
  "surface-foreground": {
    cssVar: "--surface-foreground",
    category: "surface",
    description: "Content on surface",
  },
  card: { cssVar: "--card", category: "surface", description: "Card background" },
  "card-foreground": {
    cssVar: "--card-foreground",
    category: "surface",
    description: "Content on card",
  },
  popover: { cssVar: "--popover", category: "surface", description: "Popover background" },
  "popover-foreground": {
    cssVar: "--popover-foreground",
    category: "surface",
    description: "Content on popover",
  },

  // Brand
  primary: { cssVar: "--primary", category: "brand", description: "Primary brand action" },
  "primary-foreground": {
    cssVar: "--primary-foreground",
    category: "brand",
    description: "Content on primary",
  },
  secondary: { cssVar: "--secondary", category: "brand", description: "Secondary action" },
  "secondary-foreground": {
    cssVar: "--secondary-foreground",
    category: "brand",
    description: "Content on secondary",
  },
  accent: { cssVar: "--accent", category: "brand", description: "Accent / hover surface" },
  "accent-foreground": {
    cssVar: "--accent-foreground",
    category: "brand",
    description: "Content on accent",
  },

  // Text
  text: { cssVar: "--text", category: "text", description: "Primary text" },
  "text-muted": { cssVar: "--text-muted", category: "text", description: "Muted text" },
  "text-subtle": {
    cssVar: "--text-subtle",
    category: "text",
    description: "Subtle / tertiary text",
  },
  "text-inverse": {
    cssVar: "--text-inverse",
    category: "text",
    description: "Text on inverted surfaces",
  },

  // Line / focus
  border: { cssVar: "--border", category: "line", description: "Default border" },
  input: { cssVar: "--input", category: "line", description: "Input border" },
  ring: { cssVar: "--ring", category: "line", description: "Focus ring" },

  // Status
  success: { cssVar: "--success", category: "status", description: "Success action" },
  "success-foreground": {
    cssVar: "--success-foreground",
    category: "status",
    description: "Content on success",
  },
  warning: { cssVar: "--warning", category: "status", description: "Warning action" },
  "warning-foreground": {
    cssVar: "--warning-foreground",
    category: "status",
    description: "Content on warning",
  },
  error: { cssVar: "--error", category: "status", description: "Error / destructive action" },
  "error-foreground": {
    cssVar: "--error-foreground",
    category: "status",
    description: "Content on error",
  },
  destructive: {
    cssVar: "--destructive",
    category: "status",
    description: "shadcn alias of error",
  },
  "destructive-foreground": {
    cssVar: "--destructive-foreground",
    category: "status",
    description: "Content on destructive",
  },
  info: { cssVar: "--info", category: "status", description: "Informational action" },
  "info-foreground": {
    cssVar: "--info-foreground",
    category: "status",
    description: "Content on info",
  },

  // Sidebar
  sidebar: { cssVar: "--sidebar", category: "sidebar", description: "Sidebar background" },
  "sidebar-foreground": {
    cssVar: "--sidebar-foreground",
    category: "sidebar",
    description: "Sidebar content",
  },
  "sidebar-border": {
    cssVar: "--sidebar-border",
    category: "sidebar",
    description: "Sidebar border",
  },
  "sidebar-accent": {
    cssVar: "--sidebar-accent",
    category: "sidebar",
    description: "Sidebar hover/active",
  },
  "sidebar-accent-foreground": {
    cssVar: "--sidebar-accent-foreground",
    category: "sidebar",
    description: "Content on sidebar accent",
  },

  // AI gradient
  "ai-from": { cssVar: "--ai-from", category: "ai", description: "AI gradient start" },
  "ai-via": { cssVar: "--ai-via", category: "ai", description: "AI gradient middle" },
  "ai-to": { cssVar: "--ai-to", category: "ai", description: "AI gradient end" },
} as const satisfies Record<string, ColorTokenDefinition>;

export type ColorTokenName = keyof typeof COLOR_TOKENS;

/** Resolve a token name to a usable CSS colour value, e.g. `hsl(var(--primary))`. */
export function colorVar(name: ColorTokenName): string {
  return `hsl(var(${COLOR_TOKENS[name].cssVar}))`;
}

/** All token names belonging to a given category. */
export function tokensByCategory(category: ColorTokenCategory): ColorTokenName[] {
  return (Object.keys(COLOR_TOKENS) as ColorTokenName[]).filter(
    (name) => COLOR_TOKENS[name].category === category,
  );
}

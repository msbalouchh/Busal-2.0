/**
 * Shared theme types for the Busal OS theme system.
 */
import type { ResolvedTheme, SystemPreference, ThemeMode } from "@/lib/design-tokens/theme-tokens";

/** Context value exposed by `useTheme()`. */
export interface ThemeContextValue {
  /** The mode the user selected: `dark`, `light`, or `system`. */
  theme: ThemeMode;
  /** The concrete theme currently applied to the DOM (system resolved). */
  resolvedTheme: ResolvedTheme;
  /** Live OS preference. `null` before SSR/hydration completes. */
  systemPreference: SystemPreference | null;
  /** Select a new appearance mode. Persists to storage and updates the DOM. */
  setTheme: (theme: ThemeMode) => void;
  /** Whether the theme has mounted on the client (avoids hydration mismatch). */
  mounted: boolean;
}

/** Props accepted by the theme provider. */
export interface ThemeProviderProps {
  children: React.ReactNode;
  /** Initial mode for SSR. Defaults to `dark` (dark-first). */
  defaultTheme?: ThemeMode;
  /** localStorage key used for persistence. */
  storageKey?: string;
}

export type { ResolvedTheme, SystemPreference, ThemeMode };

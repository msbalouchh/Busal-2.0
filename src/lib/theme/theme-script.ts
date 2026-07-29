/**
 * No-flash theme initialization script.
 *
 * Returned as a string and injected before hydration (e.g. into `<head>` via a
 * `<script dangerouslySetInnerHTML>`). It runs synchronously, reads the
 * persisted theme from localStorage, resolves the OS preference, and applies
 * the correct class to `<html>` before the first paint — eliminating the flash
 * of incorrect theme (FOUC) that occurs when React hydrates after paint.
 *
 * This is deliberately framework-agnostic and self-contained; it must not
 * import any application code so it can be serialized verbatim.
 */
import { THEME_CONFIG } from "@/lib/theme/theme-config";
import { DEFAULT_RESOLVED_THEME } from "@/lib/design-tokens/theme-tokens";

export function buildThemeInitScript(): string {
  const { storageKey, mediaQuery, darkSelectorClass, lightSelectorClass, defaultTheme } =
    THEME_CONFIG;

  // Inline IIFE — no external references, no source maps needed.
  return `(function(){try{var k=${JSON.stringify(storageKey)};var m=window.matchMedia(${JSON.stringify(mediaQuery)});var s=window.localStorage.getItem(k);var mode=(s==="dark"||s==="light"||s==="system")?s:${JSON.stringify(defaultTheme)};var resolved=(mode==="system")?(m.matches?"dark":"light"):mode;var root=document.documentElement;root.classList.remove(${JSON.stringify(lightSelectorClass)},${JSON.stringify(darkSelectorClass)});root.classList.add(resolved==="dark"?${JSON.stringify(darkSelectorClass)}:${JSON.stringify(lightSelectorClass)});root.style.colorScheme=resolved;}catch(e){document.documentElement.classList.add(${JSON.stringify(darkSelectorClass)});document.documentElement.style.colorScheme=${JSON.stringify(DEFAULT_RESOLVED_THEME)};}})();`;
}

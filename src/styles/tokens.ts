/**
 * Design token constants mirroring CSS variables in globals.css.
 * Use for programmatic access in charts, canvas, or native components.
 */
export const designTokens = {
  radius: {
    sm: "calc(0.5rem - 4px)",
    md: "calc(0.5rem - 2px)",
    lg: "0.5rem",
    xl: "calc(0.5rem + 4px)",
  },
} as const;

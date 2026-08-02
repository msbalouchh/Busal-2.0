import { cn } from "@/lib/utils";

/**
 * Motion utilities that respect prefers-reduced-motion via Tailwind motion-safe / motion-reduce.
 */
export const motion = {
  transition: "motion-safe:transition-all motion-safe:duration-200 motion-reduce:transition-none",
  transitionColors:
    "motion-safe:transition-colors motion-safe:duration-150 motion-reduce:transition-none",
  cardHover:
    "motion-safe:transition-all motion-safe:duration-200 motion-safe:hover:border-primary/30 motion-safe:hover:shadow-md motion-reduce:transition-none",
  cardInteractive:
    "motion-safe:transition-all motion-safe:duration-200 motion-safe:hover:-translate-y-0.5 motion-safe:hover:border-primary/30 motion-safe:hover:shadow-md motion-reduce:transition-none motion-reduce:hover:translate-y-0",
  buttonPress:
    "motion-safe:transition-transform motion-safe:duration-100 motion-safe:active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100",
  pageEnter:
    "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-300 motion-reduce:animate-none",
  fadeInUp:
    "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:duration-300 motion-reduce:animate-none",
  sidebarOverlay:
    "motion-safe:transition-opacity motion-safe:duration-200 motion-reduce:transition-none",
} as const;

export function withMotion(...classes: Array<string | false | null | undefined>): string {
  return cn(...classes);
}

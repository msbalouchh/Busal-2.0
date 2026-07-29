import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const sectionVariants = cva("w-full", {
  variants: {
    spacing: {
      none: "py-0",
      sm: "py-4",
      md: "py-6",
      lg: "py-8",
      xl: "py-12",
    },
    container: {
      none: "",
      sm: "mx-auto w-full max-w-2xl px-4",
      md: "mx-auto w-full max-w-4xl px-6",
      lg: "mx-auto w-full max-w-6xl px-6",
      xl: "mx-auto w-full max-w-7xl px-6",
      full: "px-4",
    },
  },
  defaultVariants: {
    spacing: "md",
    container: "none",
  },
});

export interface SectionProps
  extends HTMLAttributes<HTMLElement>, VariantProps<typeof sectionVariants> {}

function Section({ className, spacing, container, ...props }: SectionProps) {
  return <section className={cn(sectionVariants({ spacing, container }), className)} {...props} />;
}

export { Section, sectionVariants };

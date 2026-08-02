"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const ease = [0.22, 1, 0.36, 1] as const;

export function HomeReveal({
  children,
  className,
  delay = 0,
  y = 24,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduced ? false : { opacity: 0, y }}
      whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.65, delay, ease }}
    >
      {children}
    </motion.div>
  );
}

export function HomeFade({
  children,
  className,
  delay = 0,
  ...props
}: HTMLMotionProps<"div"> & { delay?: number }) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduced ? false : { opacity: 0 }}
      animate={reduced ? undefined : { opacity: 1 }}
      transition={{ duration: 0.7, delay, ease }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function HomeSection({
  children,
  className,
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={cn(
        "mx-auto w-full max-w-[1440px] px-4 py-20 sm:px-6 sm:py-24 lg:px-10",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function HomeEyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="mb-3 text-xs font-semibold tracking-[0.2em] text-[#3B82F6] uppercase">
      {children}
    </p>
  );
}

export function HomeHeading({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h2
      className={cn(
        "font-marketing-display max-w-3xl text-3xl tracking-tight text-balance text-white sm:text-4xl lg:text-5xl",
        className,
      )}
    >
      {children}
    </h2>
  );
}

export function HomeLead({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn("mt-4 max-w-2xl text-base text-pretty text-white/62 sm:text-lg", className)}>
      {children}
    </p>
  );
}

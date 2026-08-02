"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { motion } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  const pathname = usePathname();

  return (
    <div key={pathname} className={cn(motion.pageEnter, className)}>
      {children}
    </div>
  );
}

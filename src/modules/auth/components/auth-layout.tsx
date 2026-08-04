"use client";

import type { ReactNode } from "react";

import { BusalLogo } from "@/components/brand/busal-logo";
import { AuthCard } from "@/modules/auth/components/auth-card";
import { AuthVisualPanel } from "@/modules/auth/components/auth-visual-panel";
import { motion } from "@/lib/motion";
import { cn } from "@/lib/utils";

import "@/modules/auth/styles/auth.css";

interface AuthLayoutProps {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function AuthLayout({ title, description, children, footer, className }: AuthLayoutProps) {
  return (
    <div className={cn("auth", motion.pageEnter, className)}>
      <AuthVisualPanel />

      <div className="auth-panel">
        <main className={cn("auth-panel__inner", className)}>
          <div className="auth-panel__mobile-logo">
            <BusalLogo priority variant="horizontal" />
          </div>

          <AuthCard title={title} description={description} footer={footer}>
            {children}
          </AuthCard>
        </main>
      </div>
    </div>
  );
}

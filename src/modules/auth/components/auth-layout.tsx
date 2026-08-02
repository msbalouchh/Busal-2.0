"use client";

import type { ReactNode } from "react";

import { BusalLogo } from "@/components/brand/busal-logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface AuthLayoutProps {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function AuthLayout({ title, description, children, footer, className }: AuthLayoutProps) {
  return (
    <div className="bg-muted/30 flex min-h-screen flex-col items-center justify-center p-4 sm:p-6">
      <main className={cn("w-full max-w-md space-y-6", motion.pageEnter, className)}>
        <div className="text-center">
          <div className="flex justify-center">
            <BusalLogo height={48} priority />
          </div>
          <p className="text-muted-foreground mt-3 text-sm">AI-first business operating system</p>
        </div>

        <Card className="shadow-md">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent>{children}</CardContent>
          {footer ? <div className="border-t px-4 pb-6 sm:px-6">{footer}</div> : null}
        </Card>
      </main>
    </div>
  );
}

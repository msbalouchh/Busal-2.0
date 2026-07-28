"use client";

import type { ReactNode } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { siteConfig } from "@/config/site";
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
      <div className={cn("w-full max-w-md space-y-6", className)}>
        <div className="text-center">
          <p className="text-primary text-lg font-semibold tracking-tight">{siteConfig.name}</p>
          <p className="text-muted-foreground mt-1 text-sm">AI-first business operating system</p>
        </div>

        <Card className="shadow-md">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent>{children}</CardContent>
          {footer ? <div className="border-t px-6 pb-6">{footer}</div> : null}
        </Card>
      </div>
    </div>
  );
}

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface AuthCardProps {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function AuthCard({ title, description, children, footer, className }: AuthCardProps) {
  return (
    <div className={cn("auth-card", className)}>
      <header className="auth-card__header">
        <h2 className="auth-card__title">{title}</h2>
        <p className="auth-card__description">{description}</p>
      </header>
      <div className="auth-card__body">{children}</div>
      {footer ? <footer className="auth-card__footer">{footer}</footer> : null}
    </div>
  );
}

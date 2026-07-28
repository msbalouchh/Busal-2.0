import type { ReactNode } from "react";

interface StaffPageHeaderProps {
  title: string;
  description: string;
  children?: ReactNode;
}

export function StaffPageHeader({ title, description, children }: StaffPageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
      {children}
    </div>
  );
}

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface SidebarItemConfig {
  id: string;
  label: string;
  href?: string;
  icon?: LucideIcon;
  badge?: ReactNode;
  active?: boolean;
  disabled?: boolean;
  level?: number;
  onClick?: () => void;
  children?: SidebarItemConfig[];
}

export interface SidebarGroupConfig {
  id: string;
  title: string;
  icon?: LucideIcon;
  badge?: ReactNode;
  defaultOpen?: boolean;
  collapsible?: boolean;
  items: SidebarItemConfig[];
}

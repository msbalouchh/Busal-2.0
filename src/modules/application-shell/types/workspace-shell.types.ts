import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export type ThemePreference = "light" | "dark" | "system";

export interface WorkspaceSummary {
  id: string;
  name: string;
  slug: string;
  role: string;
  isActive: boolean;
}

export interface WorkspaceNavItem {
  id: string;
  label: string;
  href?: string;
  icon: LucideIcon;
  badge?: string | number;
  disabled?: boolean;
  children?: WorkspaceNavItem[];
}

export interface WorkspaceNavSection {
  id: string;
  label: string;
  items: WorkspaceNavItem[];
  defaultOpen?: boolean;
}

export interface WorkspaceNotification {
  id: string;
  title: string;
  body: string;
  category: "order" | "ai" | "system" | "marketing" | "staff" | "billing";
  createdAt: string;
  read: boolean;
  href?: string;
}

export interface WorkspaceShellContextValue {
  workspaceName: string;
  workspaces: WorkspaceSummary[];
  activeWorkspaceId: string;
  switchWorkspace: (workspaceId: string) => void;
  isRightDrawerOpen: boolean;
  openRightDrawer: () => void;
  closeRightDrawer: () => void;
  isNotificationCenterOpen: boolean;
  openNotificationCenter: () => void;
  closeNotificationCenter: () => void;
  notifications: WorkspaceNotification[];
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
}

export interface WorkspaceShellLayoutProps {
  children: ReactNode;
  workspaceName?: string;
  businessName?: string;
  branchName?: string | null;
  userName?: string;
  userEmail?: string;
  workspaces?: WorkspaceSummary[];
  notifications?: WorkspaceNotification[];
}

export interface CommandPaletteItem {
  id: string;
  label: string;
  description: string;
  group: string;
  icon: LucideIcon;
  href: string;
  keywords: string[];
}

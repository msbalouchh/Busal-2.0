export { CommandSearch } from "@/modules/application-shell/components/command-search";
export { CommandPalette } from "@/modules/application-shell/components/command-palette";
export { NotificationDropdown } from "@/modules/application-shell/components/notification-dropdown";
export {
  NotificationCenter,
  NotificationCenterTrigger,
} from "@/modules/application-shell/components/notification-center";
export { PageTransition } from "@/modules/application-shell/components/page-transition";
export { UserMenu } from "@/modules/application-shell/components/user-menu";
export { AiAssistantButton } from "@/modules/application-shell/components/ai-assistant-button";
export { WorkspaceSwitcher } from "@/modules/application-shell/components/workspace-switcher";
export { WorkspaceHeader } from "@/modules/application-shell/components/workspace-header";
export { WorkspaceSidebar } from "@/modules/application-shell/components/workspace-sidebar";
export { WorkspaceMainContent } from "@/modules/application-shell/components/workspace-main-content";
export { WorkspaceRightDrawer } from "@/modules/application-shell/components/workspace-right-drawer";
export { WorkspaceShell } from "@/modules/application-shell/components/workspace-shell";

export {
  WorkspaceShellProvider,
  useWorkspaceShellContext,
} from "@/modules/application-shell/providers/workspace-shell-provider";
export {
  useWorkspaceShell,
  useWorkspaceNavigation,
} from "@/modules/application-shell/hooks/use-workspace-shell";
export { useCommandPalette } from "@/modules/application-shell/hooks/use-command-palette";

export { WORKSPACE_SHELL_ROUTES } from "@/modules/application-shell/constants/routes";
export { WORKSPACE_PRIMARY_NAV } from "@/modules/application-shell/constants/navigation";
export { MOCK_WORKSPACES } from "@/modules/application-shell/constants/mock-workspaces";
export { MOCK_WORKSPACE_NOTIFICATIONS } from "@/modules/application-shell/constants/mock-notifications";

export type {
  ThemePreference,
  WorkspaceSummary,
  WorkspaceNavItem,
  WorkspaceNavSection,
  WorkspaceNotification,
  WorkspaceShellContextValue,
  WorkspaceShellLayoutProps,
  CommandPaletteItem,
} from "@/modules/application-shell/types/workspace-shell.types";

export {
  normalizePath,
  isWorkspacePathActive,
  isWorkspaceNavItemActive,
  flattenWorkspaceNavItems,
  resolveActiveWorkspaceNavLabel,
} from "@/modules/application-shell/utils/navigation";

export { formatRelativeTime } from "@/modules/application-shell/utils/format-relative-time";

export { WorkspaceShell as WorkspaceShellLayout } from "@/modules/application-shell/layouts/workspace-shell-layout";

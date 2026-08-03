import type { WorkspaceNotification } from "@/modules/application-shell/types/workspace-shell.types";
import { WORKSPACE_SHELL_ROUTES } from "@/modules/application-shell/constants/routes";

export const MOCK_WORKSPACE_NOTIFICATIONS: WorkspaceNotification[] = [
  {
    id: "ntf-001",
    title: "New order received",
    body: "Table 12 placed an order for £84.50.",
    category: "order",
    createdAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    read: false,
    href: WORKSPACE_SHELL_ROUTES.orders,
  },
  {
    id: "ntf-002",
    title: "AI insight ready",
    body: "Weekly revenue forecast is available for review.",
    category: "ai",
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    read: false,
    href: WORKSPACE_SHELL_ROUTES.ai,
  },
  {
    id: "ntf-003",
    title: "Low stock alert",
    body: "Salmon fillet is below reorder threshold.",
    category: "system",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    read: true,
    href: WORKSPACE_SHELL_ROUTES.inventory,
  },
  {
    id: "ntf-004",
    title: "Campaign scheduled",
    body: "Weekend loyalty push launches Friday at 09:00.",
    category: "marketing",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    read: true,
    href: WORKSPACE_SHELL_ROUTES.marketing,
  },
];

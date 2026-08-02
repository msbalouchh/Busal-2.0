import {
  Bot,
  Activity,
  Boxes,
  Building2,
  LayoutDashboard,
  Network,
  Plug,
  Settings,
  ShoppingBag,
  Users,
  UtensilsCrossed,
  Workflow,
  MessageSquare,
  FileText,
  ImageIcon,
  Cloud,
  Code2,
  type LucideIcon,
} from "lucide-react";

export const APPLICATION_SHELL_ROUTES = {
  dashboard: "/app",
  modules: "/app/modules",
  branches: "/app/branches",
  staff: "/app/staff",
  restaurant: "/app/restaurant",
  ai: "/app/ai",
  crm: "/app/crm",
  marketplace: "/app/marketplace",
  integrations: "/app/integrations",
  automation: "/app/automation",
  communications: "/app/communications",
  documents: "/app/documents",
  media: "/app/media",
  developer: "/app/developer",
  observability: "/app/observability",
  enterprise: "/app/enterprise",
  cloud: "/app/cloud",
  settings: "/app/settings",
} as const;

export interface ApplicationShellNavItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
}

export const APPLICATION_SHELL_NAV_ITEMS: ApplicationShellNavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: APPLICATION_SHELL_ROUTES.dashboard,
    icon: LayoutDashboard,
  },
  {
    id: "modules",
    label: "Modules",
    href: APPLICATION_SHELL_ROUTES.modules,
    icon: Boxes,
  },
  {
    id: "branches",
    label: "Branches",
    href: APPLICATION_SHELL_ROUTES.branches,
    icon: Building2,
  },
  {
    id: "staff",
    label: "Staff",
    href: APPLICATION_SHELL_ROUTES.staff,
    icon: Users,
  },
  {
    id: "restaurant",
    label: "Restaurant",
    href: APPLICATION_SHELL_ROUTES.restaurant,
    icon: UtensilsCrossed,
  },
  {
    id: "ai",
    label: "AI",
    href: APPLICATION_SHELL_ROUTES.ai,
    icon: Bot,
  },
  {
    id: "crm",
    label: "CRM",
    href: APPLICATION_SHELL_ROUTES.crm,
    icon: Users,
  },
  {
    id: "marketplace",
    label: "Marketplace",
    href: APPLICATION_SHELL_ROUTES.marketplace,
    icon: ShoppingBag,
  },
  {
    id: "integrations",
    label: "Integrations",
    href: APPLICATION_SHELL_ROUTES.integrations,
    icon: Plug,
  },
  {
    id: "automation",
    label: "Automation",
    href: APPLICATION_SHELL_ROUTES.automation,
    icon: Workflow,
  },
  {
    id: "communications",
    label: "Communications",
    href: APPLICATION_SHELL_ROUTES.communications,
    icon: MessageSquare,
  },
  {
    id: "documents",
    label: "Documents",
    href: APPLICATION_SHELL_ROUTES.documents,
    icon: FileText,
  },
  {
    id: "media",
    label: "Media",
    href: APPLICATION_SHELL_ROUTES.media,
    icon: ImageIcon,
  },
  {
    id: "developer",
    label: "Developer",
    href: APPLICATION_SHELL_ROUTES.developer,
    icon: Code2,
  },
  {
    id: "observability",
    label: "Observability",
    href: APPLICATION_SHELL_ROUTES.observability,
    icon: Activity,
  },
  {
    id: "enterprise",
    label: "Enterprise",
    href: APPLICATION_SHELL_ROUTES.enterprise,
    icon: Network,
  },
  {
    id: "cloud",
    label: "Cloud",
    href: APPLICATION_SHELL_ROUTES.cloud,
    icon: Cloud,
  },
  {
    id: "settings",
    label: "Settings",
    href: APPLICATION_SHELL_ROUTES.settings,
    icon: Settings,
  },
];

export function isApplicationShellPathActive(pathname: string, href: string): boolean {
  if (href === APPLICATION_SHELL_ROUTES.dashboard) {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { CUSTOMER_CRM_ROUTES } from "@/modules/customer-crm-management/constants/routes";
import { RESERVATION_MANAGEMENT_ROUTES } from "@/modules/reservation-management/constants/routes";
import { RESTAURANT_ANALYTICS_ROUTES } from "@/modules/restaurant-analytics-management/constants/routes";
import { AI_RESTAURANT_ASSISTANT_ROUTES } from "@/modules/ai-restaurant-assistant-management/constants/routes";

export const APPLICATION_HOME_QUICK_ACTIONS = [
  {
    id: "create-order",
    label: "New Order",
    description: "Start a new order flow",
    href: "/app/restaurant/orders/new",
  },
  {
    id: "add-customer",
    label: "Add Customer",
    description: "Capture a new guest profile",
    href: CUSTOMER_CRM_ROUTES.create(),
  },
  {
    id: "manage-staff",
    label: "Manage Staff",
    description: "Review team members and roles",
    href: APPLICATION_SHELL_ROUTES.staff,
  },
  {
    id: "open-ai",
    label: "Open AI Assistant",
    description: "Ask Busal for recommendations",
    href: AI_RESTAURANT_ASSISTANT_ROUTES.dashboard(),
  },
  {
    id: "view-reports",
    label: "View Reports",
    description: "Explore performance analytics",
    href: RESTAURANT_ANALYTICS_ROUTES.dashboard(),
  },
  {
    id: "settings",
    label: "Settings",
    description: "Configure workspace preferences",
    href: APPLICATION_SHELL_ROUTES.settings,
  },
] as const;

export const APPLICATION_HOME_FAVORITE_SHORTCUTS = [
  {
    id: "restaurant",
    label: "Restaurant",
    description: "Operations hub",
    href: APPLICATION_SHELL_ROUTES.restaurant,
  },
  {
    id: "reservations",
    label: "Reservations",
    description: "Today's bookings",
    href: RESERVATION_MANAGEMENT_ROUTES.list(),
  },
  {
    id: "inventory",
    label: "Inventory",
    description: "Stock and suppliers",
    href: `${APPLICATION_SHELL_ROUTES.restaurant}/inventory`,
  },
  {
    id: "integrations",
    label: "Integrations",
    description: "Connected services",
    href: APPLICATION_SHELL_ROUTES.integrations,
  },
] as const;

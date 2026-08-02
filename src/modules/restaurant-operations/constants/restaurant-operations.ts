export const RESTAURANT_OPERATIONS_ROUTES = {
  overview: "/dashboard/restaurant",
  menu: "/dashboard/restaurant/menu",
  tables: "/dashboard/restaurant/tables",
  reservations: "/dashboard/restaurant/reservations",
  orders: "/dashboard/restaurant/orders",
  kitchen: "/dashboard/restaurant/kitchen",
  pos: "/dashboard/restaurant/pos",
  inventory: "/dashboard/restaurant/inventory",
} as const;

export const RESTAURANT_OPERATIONS_NAV_ITEMS = [
  { label: "Overview", href: RESTAURANT_OPERATIONS_ROUTES.overview },
  { label: "Menu", href: RESTAURANT_OPERATIONS_ROUTES.menu },
  { label: "Tables", href: RESTAURANT_OPERATIONS_ROUTES.tables },
  { label: "Reservations", href: RESTAURANT_OPERATIONS_ROUTES.reservations },
  { label: "Orders", href: RESTAURANT_OPERATIONS_ROUTES.orders },
  { label: "Kitchen", href: RESTAURANT_OPERATIONS_ROUTES.kitchen },
  { label: "POS", href: RESTAURANT_OPERATIONS_ROUTES.pos },
  { label: "Inventory", href: RESTAURANT_OPERATIONS_ROUTES.inventory },
] as const;

export const ORDER_QUEUE_PAGE_SIZE = 20;

export const RESERVATION_VIEW_MODES = ["calendar", "daily", "weekly"] as const;

export type ReservationViewMode = (typeof RESERVATION_VIEW_MODES)[number];

export const ORDER_STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending" },
  { value: "ACCEPTED", label: "Accepted" },
  { value: "PREPARING", label: "Preparing" },
  { value: "READY", label: "Ready" },
  { value: "SERVED", label: "Served" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
] as const;

export const FULFILMENT_TYPE_OPTIONS = [
  { value: "DINE_IN", label: "Dine-in" },
  { value: "TAKEAWAY", label: "Takeaway" },
  { value: "DELIVERY", label: "Delivery" },
] as const;

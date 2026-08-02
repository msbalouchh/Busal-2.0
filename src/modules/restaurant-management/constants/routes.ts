export const RESTAURANT_MANAGEMENT_ROUTES = {
  dashboard: "/app/restaurant",
  settings: "/app/restaurant/settings",
  branding: "/app/restaurant/branding",
  preferences: "/app/restaurant/preferences",
} as const;

export const RESTAURANT_MODULE_KEY = "restaurant" as const;

export const RESTAURANT_FEATURE_TOGGLES = [
  {
    key: "kitchenDisplayEnabled" as const,
    label: "Kitchen Display",
    description: "Enable kitchen display system for order preparation.",
  },
  {
    key: "qrOrderingEnabled" as const,
    label: "QR Ordering",
    description: "Allow guests to order via QR codes at tables.",
  },
  {
    key: "posEnabled" as const,
    label: "Point of Sale",
    description: "Enable POS terminal for in-venue checkout.",
  },
  {
    key: "loyaltyEnabled" as const,
    label: "Loyalty Programme",
    description: "Reward repeat guests with points and offers.",
  },
  {
    key: "onlineOrderingEnabled" as const,
    label: "Online Ordering",
    description: "Accept takeaway and delivery orders online.",
  },
] as const;

export const RESTAURANT_SERVICE_MODES = [
  {
    key: "allowDineIn" as const,
    label: "Dine-in",
    description: "Table service and in-venue dining.",
  },
  {
    key: "allowTakeaway" as const,
    label: "Takeaway",
    description: "Collection orders for pickup.",
  },
  {
    key: "allowDelivery" as const,
    label: "Delivery",
    description: "Deliver orders to customer addresses.",
  },
  {
    key: "allowReservations" as const,
    label: "Reservations",
    description: "Accept table bookings in advance.",
  },
] as const;

import type { IndustryModuleDefinition } from "@/modules/business-modules/types/business-module-types";

const MODULE_VERSION = "1.0.0";

function buildModuleDefinition(
  definition: Omit<IndustryModuleDefinition, "version" | "category"> & {
    category?: IndustryModuleDefinition["category"];
  },
): IndustryModuleDefinition {
  return {
    ...definition,
    version: MODULE_VERSION,
    category: definition.category ?? "Industry",
  };
}

export const INDUSTRY_MODULE_DEFINITIONS: IndustryModuleDefinition[] = [
  buildModuleDefinition({
    moduleKey: "restaurant",
    displayName: "Restaurant",
    iconKey: "utensils-crossed",
    description: "Table service, menus, kitchen workflow, and hospitality operations.",
    permissions: [
      "restaurant.view",
      "restaurant.update",
      "restaurant.settings",
      "restaurant.branding",
      "menu.view",
      "menu.create",
      "menu.update",
      "menu.delete",
      "menu.publish",
      "category.view",
      "category.create",
      "category.update",
      "category.delete",
      "category.publish",
      "product.view",
      "product.create",
      "product.update",
      "product.delete",
      "product.publish",
      "product.import",
      "product.export",
      "modifier.view",
      "modifier.create",
      "modifier.update",
      "modifier.delete",
      "modifier.assign",
      "floor.view",
      "floor.create",
      "floor.update",
      "floor.delete",
      "table.view",
      "table.create",
      "table.update",
      "table.delete",
      "reservation.view",
      "reservation.create",
      "reservation.update",
      "reservation.delete",
      "reservation.cancel",
      "reservation.assign_table",
      "reservation.assign_staff",
      "order.view",
      "order.create",
      "order.update",
      "order.delete",
      "order.cancel",
      "order.discount",
      "order.transfer",
      "kitchen.view",
      "kitchen.update",
      "kitchen.assign_station",
      "kitchen.manage",
      "qr.view",
      "qr.create",
      "qr.update",
      "qr.delete",
      "qr.generate",
      "payment.view",
      "payment.create",
      "payment.refund",
      "payment.void",
      "receipt.view",
      "receipt.print",
      "receipt.email",
    ],
    routes: {
      dashboard: "/app/restaurant",
      settings: "/app/restaurant/settings",
    },
    futureCapabilities: [
      "Menu management",
      "POS",
      "Reservations",
      "Kitchen display",
      "Table management",
    ],
  }),
  buildModuleDefinition({
    moduleKey: "salon",
    displayName: "Salon",
    iconKey: "scissors",
    description: "Appointments, stylists, services, and client experience for salons and barbers.",
    permissions: ["salon.view", "salon.manage"],
    routes: { dashboard: "/app/modules/salon", settings: "/app/modules/salon" },
    futureCapabilities: [
      "Appointment booking",
      "Staff scheduling",
      "Service catalog",
      "Client profiles",
    ],
  }),
  buildModuleDefinition({
    moduleKey: "clinic",
    displayName: "Clinic",
    iconKey: "stethoscope",
    description: "Patient scheduling, practitioners, and clinical workflow management.",
    permissions: ["clinic.view", "clinic.manage"],
    routes: { dashboard: "/app/modules/clinic", settings: "/app/modules/clinic" },
    futureCapabilities: ["Patient records", "Appointments", "Practitioner scheduling", "Billing"],
  }),
  buildModuleDefinition({
    moduleKey: "retail",
    displayName: "Retail",
    iconKey: "shopping-bag",
    description: "Inventory, checkout, and omnichannel retail operations.",
    permissions: ["retail.view", "retail.manage"],
    routes: { dashboard: "/app/modules/retail", settings: "/app/modules/retail" },
    futureCapabilities: ["Product catalog", "Inventory", "Checkout", "Sales analytics"],
  }),
  buildModuleDefinition({
    moduleKey: "hotel",
    displayName: "Hotel",
    iconKey: "hotel",
    description: "Rooms, bookings, housekeeping, and guest services.",
    permissions: ["hotel.view", "hotel.manage"],
    routes: { dashboard: "/app/modules/hotel", settings: "/app/modules/hotel" },
    futureCapabilities: ["Room inventory", "Bookings", "Housekeeping", "Guest services"],
  }),
  buildModuleDefinition({
    moduleKey: "gym",
    displayName: "Gym",
    iconKey: "dumbbell",
    description: "Memberships, classes, trainers, and fitness facility operations.",
    permissions: ["gym.view", "gym.manage"],
    routes: { dashboard: "/app/modules/gym", settings: "/app/modules/gym" },
    futureCapabilities: ["Memberships", "Class scheduling", "Trainer management", "Access control"],
  }),
  buildModuleDefinition({
    moduleKey: "pharmacy",
    displayName: "Pharmacy",
    iconKey: "pill",
    description: "Prescriptions, inventory, and regulated pharmacy workflows.",
    permissions: ["pharmacy.view", "pharmacy.manage"],
    routes: { dashboard: "/app/modules/pharmacy", settings: "/app/modules/pharmacy" },
    futureCapabilities: ["Prescription management", "Inventory", "Compliance", "Dispensing"],
  }),
  buildModuleDefinition({
    moduleKey: "education",
    displayName: "Education",
    iconKey: "graduation-cap",
    description: "Courses, enrolments, instructors, and learning operations.",
    permissions: ["education.view", "education.manage"],
    routes: { dashboard: "/app/modules/education", settings: "/app/modules/education" },
    futureCapabilities: ["Course catalog", "Enrolments", "Scheduling", "Progress tracking"],
  }),
  buildModuleDefinition({
    moduleKey: "real-estate",
    displayName: "Real Estate",
    iconKey: "building-2",
    description: "Listings, viewings, agents, and property transaction workflows.",
    permissions: ["real_estate.view", "real_estate.manage"],
    routes: { dashboard: "/app/modules/real-estate", settings: "/app/modules/real-estate" },
    futureCapabilities: ["Property listings", "Viewings", "Agent CRM", "Document management"],
  }),
  buildModuleDefinition({
    moduleKey: "professional-services",
    displayName: "Professional Services",
    iconKey: "briefcase",
    description: "Projects, clients, time tracking, and service delivery.",
    permissions: ["professional_services.view", "professional_services.manage"],
    routes: {
      dashboard: "/app/modules/professional-services",
      settings: "/app/modules/professional-services",
    },
    futureCapabilities: ["Projects", "Time tracking", "Invoicing", "Client portal"],
  }),
  buildModuleDefinition({
    moduleKey: "car-wash",
    displayName: "Car Wash",
    iconKey: "car",
    description: "Service bays, packages, memberships, and vehicle queue management.",
    permissions: ["car_wash.view", "car_wash.manage"],
    routes: { dashboard: "/app/modules/car-wash", settings: "/app/modules/car-wash" },
    futureCapabilities: ["Service packages", "Bay scheduling", "Memberships", "Queue management"],
  }),
];

const moduleRegistry = new Map<string, IndustryModuleDefinition>(
  INDUSTRY_MODULE_DEFINITIONS.map((definition) => [definition.moduleKey, definition]),
);

export function registerIndustryModule(definition: IndustryModuleDefinition): void {
  moduleRegistry.set(definition.moduleKey, definition);
}

export function getIndustryModule(moduleKey: string): IndustryModuleDefinition | undefined {
  return moduleRegistry.get(moduleKey);
}

export function listIndustryModules(): IndustryModuleDefinition[] {
  return Array.from(moduleRegistry.values());
}

export function listIndustryModulesByCategory(
  category: IndustryModuleDefinition["category"],
): IndustryModuleDefinition[] {
  return listIndustryModules().filter((definition) => definition.category === category);
}

export function isRegisteredIndustryModule(moduleKey: string): boolean {
  return moduleRegistry.has(moduleKey);
}

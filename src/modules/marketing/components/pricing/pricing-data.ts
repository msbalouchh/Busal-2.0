export type PlanTier = "busal-core" | "busal-growth" | "busal-pro" | "busal-enterprise";

export type CompareValue = boolean | string;

export const PRICING_PLAN_TIERS: PlanTier[] = [
  "busal-core",
  "busal-growth",
  "busal-pro",
  "busal-enterprise",
];

export const PRICING_PLAN_LABELS: Record<PlanTier, string> = {
  "busal-core": "Busal Core",
  "busal-growth": "Busal Growth",
  "busal-pro": "Busal Pro",
  "busal-enterprise": "Busal Enterprise",
};

export const PRICING_FAQ = [
  {
    q: "How does billing work?",
    a: "Plans are billed monthly or annually after your one-time implementation. Annual billing saves approximately 17% compared to paying month-to-month. Invoices are issued per business tenant.",
  },
  {
    q: "Are there long-term contracts?",
    a: "Monthly plans are subscription-based with no long-term lock-in. Enterprise agreements may include custom terms, SLAs, and volume pricing suited to multi-entity groups.",
  },
  {
    q: "What does setup include?",
    a: "Professional onboarding covers discovery, business configuration, data migration, menu import, staff setup, training, and go-live support—handled by the Busal implementation team, not a self-serve checklist.",
  },
  {
    q: "Can you migrate our existing data?",
    a: "Yes. We migrate customers, products, menus, staff roles, and historical records where available. Scope is confirmed during business analysis before go-live.",
  },
  {
    q: "What support is included?",
    a: "Core includes email support. Growth adds priority support. Pro and Enterprise include advanced success coverage and custom SLAs.",
  },
  {
    q: "Can we cancel anytime?",
    a: "Monthly subscriptions can be cancelled according to your plan terms. We recommend completing an export window with our team so you retain operational records.",
  },
  {
    q: "How does AI usage work on each plan?",
    a: "Core includes a standard AI assistant. Growth adds AI automation and domain agents. Pro and Enterprise include the full agent suite with advanced orchestration and custom workflows.",
  },
  {
    q: "Is our business data secure?",
    a: "Yes. Busal uses tenant isolation, role-based permissions, encrypted data in transit and at rest, and enterprise-grade cloud infrastructure. AI operates within your permission model—never across businesses.",
  },
] as const;

export const COMPARE_FEATURES: {
  feature: string;
  "busal-core": CompareValue;
  "busal-growth": CompareValue;
  "busal-pro": CompareValue;
  "busal-enterprise": CompareValue;
}[] = [
  { feature: "Authentication", "busal-core": true, "busal-growth": true, "busal-pro": true, "busal-enterprise": "SSO" },
  { feature: "POS", "busal-core": true, "busal-growth": true, "busal-pro": true, "busal-enterprise": true },
  { feature: "Reservations", "busal-core": "Basic", "busal-growth": true, "busal-pro": true, "busal-enterprise": true },
  { feature: "QR Menu", "busal-core": true, "busal-growth": true, "busal-pro": true, "busal-enterprise": true },
  { feature: "Kitchen Display", "busal-core": true, "busal-growth": true, "busal-pro": true, "busal-enterprise": true },
  { feature: "CRM", "busal-core": "Essential", "busal-growth": true, "busal-pro": true, "busal-enterprise": true },
  { feature: "Marketing", "busal-core": false, "busal-growth": true, "busal-pro": true, "busal-enterprise": true },
  { feature: "Analytics", "busal-core": "Standard", "busal-growth": true, "busal-pro": true, "busal-enterprise": true },
  {
    feature: "AI Employees",
    "busal-core": "Assistant",
    "busal-growth": "Core agents",
    "busal-pro": "Advanced agents",
    "busal-enterprise": "Full suite",
  },
  { feature: "AI Automation", "busal-core": false, "busal-growth": true, "busal-pro": true, "busal-enterprise": true },
  { feature: "Reports", "busal-core": true, "busal-growth": true, "busal-pro": true, "busal-enterprise": true },
  { feature: "Inventory", "busal-core": true, "busal-growth": true, "busal-pro": true, "busal-enterprise": true },
  { feature: "API", "busal-core": false, "busal-growth": "Standard", "busal-pro": true, "busal-enterprise": true },
  { feature: "Integrations", "busal-core": "Core", "busal-growth": true, "busal-pro": "Advanced", "busal-enterprise": "Custom" },
  { feature: "Priority Support", "busal-core": false, "busal-growth": true, "busal-pro": true, "busal-enterprise": true },
  { feature: "Multi-Branch", "busal-core": false, "busal-growth": "Up to 5", "busal-pro": "Up to 10", "busal-enterprise": "Unlimited" },
  { feature: "White Label", "busal-core": false, "busal-growth": false, "busal-pro": false, "busal-enterprise": true },
  { feature: "Enterprise Security", "busal-core": "Standard", "busal-growth": true, "busal-pro": true, "busal-enterprise": true },
];

export const SETUP_ITEMS = [
  {
    title: "Professional Onboarding",
    desc: "Structured discovery workshops with your managers and owners.",
  },
  {
    title: "Data Migration",
    desc: "Customers, products, and historical records moved with validation.",
  },
  {
    title: "Menu Import",
    desc: "Catalog, modifiers, and pricing configured for live service.",
  },
  {
    title: "Staff Setup",
    desc: "Roles, permissions, and branch access mapped to how you operate.",
  },
  {
    title: "Business Configuration",
    desc: "Modules, workflows, and integrations tuned to your model.",
  },
  {
    title: "Training",
    desc: "Floor, kitchen, and manager training with real service scenarios.",
  },
  {
    title: "Custom Branding",
    desc: "Guest-facing surfaces aligned with your brand guidelines.",
  },
] as const;

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
    a: "Starter includes email support. Growth adds priority support. Enterprise includes a dedicated account manager, custom SLAs, and hands-on success coverage.",
  },
  {
    q: "Can we cancel anytime?",
    a: "Monthly subscriptions can be cancelled according to your plan terms. We recommend completing an export window with our team so you retain operational records.",
  },
  {
    q: "How does AI usage work on each plan?",
    a: "Starter includes a standard AI assistant. Growth adds AI automation and domain agents for operations and marketing. Enterprise includes the full agent suite with advanced orchestration and custom workflows.",
  },
  {
    q: "Is our business data secure?",
    a: "Yes. Busal uses tenant isolation, role-based permissions, encrypted data in transit and at rest, and enterprise-grade cloud infrastructure. AI operates within your permission model—never across businesses.",
  },
] as const;

export type PlanTier = "starter" | "growth" | "enterprise";

export type CompareValue = boolean | string;

export const COMPARE_FEATURES: {
  feature: string;
  starter: CompareValue;
  growth: CompareValue;
  enterprise: CompareValue;
}[] = [
  { feature: "Authentication", starter: true, growth: true, enterprise: "SSO" },
  { feature: "POS", starter: true, growth: true, enterprise: true },
  { feature: "Reservations", starter: "Basic", growth: true, enterprise: true },
  { feature: "QR Menu", starter: true, growth: true, enterprise: true },
  { feature: "Kitchen Display", starter: true, growth: true, enterprise: true },
  { feature: "CRM", starter: "Essential", growth: true, enterprise: true },
  { feature: "Marketing", starter: false, growth: true, enterprise: true },
  { feature: "Analytics", starter: "Standard", growth: true, enterprise: true },
  {
    feature: "AI Employees",
    starter: "Assistant",
    growth: "Core agents",
    enterprise: "Full suite",
  },
  { feature: "AI Automation", starter: false, growth: true, enterprise: true },
  { feature: "Reports", starter: true, growth: true, enterprise: true },
  { feature: "Inventory", starter: true, growth: true, enterprise: true },
  { feature: "API", starter: false, growth: "Standard", enterprise: true },
  { feature: "Integrations", starter: "Core", growth: true, enterprise: "Custom" },
  { feature: "Priority Support", starter: false, growth: true, enterprise: true },
  { feature: "Multi-Branch", starter: false, growth: "Up to 5", enterprise: "Unlimited" },
  { feature: "White Label", starter: false, growth: false, enterprise: true },
  { feature: "Enterprise Security", starter: "Standard", growth: true, enterprise: true },
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

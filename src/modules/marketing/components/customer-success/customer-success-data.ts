export const SUCCESS_FAQ = [
  {
    q: "How long does implementation take?",
    a: "Most businesses go live within four weeks—from discovery and data migration through configuration, staff training, and hands-on launch support. Timeline adjusts for branch count and data complexity.",
  },
  {
    q: "Do you migrate our existing data?",
    a: "Yes. Our team migrates customers, products, menus, staff roles, and historical records where available. Scope is confirmed during business discovery before configuration begins.",
  },
  {
    q: "What does training include?",
    a: "Manager and floor training tailored to your service model—POS, kitchen, reservations, CRM, and AI briefings. We run dry-run scenarios so teams are confident before go-live.",
  },
  {
    q: "What support do we get after launch?",
    a: "Ongoing success coverage includes priority support on Growth plans and dedicated account management for Enterprise. We help optimise workflows, AI agents, and analytics as you scale.",
  },
  {
    q: "How quickly will we see ROI?",
    a: "Most operators report recovered manager hours within the first month and measurable revenue lift within 60–90 days as loyalty, upsells, and inventory accuracy compound on live data.",
  },
  {
    q: "Is our data secure throughout?",
    a: "Yes. Tenant isolation, role-based permissions, encrypted data in transit and at rest, and GDPR-ready controls are built into the platform—not bolted on after go-live.",
  },
] as const;

export const TRUST_BADGES = [
  { title: "Enterprise Security", desc: "Encrypted, audited, tenant-isolated by design." },
  { title: "99.99% Uptime", desc: "Production-grade cloud with redundancy." },
  { title: "GDPR Ready", desc: "Privacy controls aligned with UK and EU expectations." },
  { title: "Cloud Infrastructure", desc: "Zero server maintenance for your team." },
  {
    title: "Scalable Architecture",
    desc: "One location to enterprise group without re-platforming.",
  },
  { title: "AI Powered", desc: "Domain agents on live operational data." },
] as const;

export const JOURNEY_STEPS = [
  { title: "Book Demo", desc: "Walk through your workflows with a Busal specialist." },
  { title: "Business Discovery", desc: "Map branches, roles, menus, and success metrics." },
  { title: "Data Migration", desc: "Customers, catalog, and history moved with validation." },
  { title: "Configuration", desc: "Modules, permissions, and integrations tuned to you." },
  { title: "Staff Training", desc: "Managers and teams learn rhythms that stick." },
  { title: "Go Live", desc: "Launch with hands-on support during service." },
  { title: "Ongoing Success", desc: "Optimise with AI, analytics, and continuous partnership." },
] as const;

export const BEFORE_AFTER = [
  {
    phase: "Before Busal",
    items: [
      "Five disconnected tools and spreadsheet exports",
      "Kitchen and POS disagree on order status",
      "Managers reconcile data after close",
      "Generic AI with no operational context",
      "No single view across branches",
    ],
  },
  {
    phase: "After Busal",
    items: [
      "One operating system for every department",
      "Single order truth from table to kitchen",
      "Live dashboards and AI morning briefings",
      "Domain agents on orders, stock, and CRM",
      "Branch-level visibility with group governance",
    ],
  },
] as const;

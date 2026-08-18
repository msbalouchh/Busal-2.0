import {
  getCommercialPlanMonthlyAmount,
  listPublicCommercialPlans,
} from "@/modules/billing/lib/commercial-plan-display";
import { BUSAL_COMMERCIAL_PLAN_SLUGS } from "@/modules/control-center/billing/registry/subscription-plan-registry";

export const BRAND = {
  name: "Busal OS",
  domain: "https://www.getbusal.com",
  tagline: "The AI Operating System for Modern Businesses",
  description:
    "Busal OS unifies operations, customers, finance, and intelligence into one AI-first platform—so growing businesses run with clarity, speed, and control.",
} as const;

export const STATS = [
  { value: "1", label: "Operating system", hint: "for your entire business" },
  { value: "20+", label: "Connected modules", hint: "from POS to AI agents" },
  { value: "11", label: "Industries ready", hint: "start with restaurants, expand anywhere" },
  { value: "24/7", label: "AI assistance", hint: "insights when decisions matter" },
] as const;

export const MODULES = [
  {
    name: "CRM",
    summary: "Know every customer—history, loyalty, preferences, and next best action.",
  },
  {
    name: "POS",
    summary: "Fast checkout, split payments, receipts, and live order flow.",
  },
  {
    name: "Inventory",
    summary: "Stock, suppliers, purchase orders, and cost control in one place.",
  },
  {
    name: "Reservations",
    summary: "Tables, covers, and guest journeys without double-booking chaos.",
  },
  {
    name: "QR Ordering",
    summary: "Guest-facing menus and orders that sync straight to the kitchen.",
  },
  {
    name: "Kitchen Display",
    summary: "Accept, prepare, and serve with a queue built for real service.",
  },
  {
    name: "Finance",
    summary: "Payments, invoices, and revenue visibility without spreadsheet drift.",
  },
  {
    name: "HR & Payroll",
    summary: "Staff, roles, permissions, and people operations that stay auditable.",
  },
  {
    name: "Marketing",
    summary: "Campaigns, segments, and messaging grounded in live customer data.",
  },
  {
    name: "Analytics & Reports",
    summary: "Sales, product, staff, and inventory intelligence you can act on.",
  },
  {
    name: "AI Platform",
    summary: "Domain agents for sales, support, finance, HR, and operations.",
  },
  {
    name: "Customer Portal",
    summary: "Orders, loyalty, invoices, and support—self-serve for your guests.",
  },
  {
    name: "Business Admin",
    summary: "Branches, settings, documents, media, and day-to-day control.",
  },
  {
    name: "Super Admin",
    summary: "Platform-level tenants, billing, monitoring, and support oversight.",
  },
] as const;

export const AI_AGENTS = [
  {
    name: "AI CEO",
    summary: "Cross-business briefing: health, risks, and priorities in plain language.",
  },
  {
    name: "AI Sales",
    summary: "Pipeline coaching, opportunity scoring, and follow-up recommendations.",
  },
  {
    name: "AI Marketing",
    summary: "Audience insight, campaign framing, and performance guidance.",
  },
  {
    name: "AI Finance",
    summary: "Cashflow signals, invoice patterns, and cost anomaly awareness.",
  },
  {
    name: "AI HR",
    summary: "Hiring support, rostering context, and people-ops recommendations.",
  },
  {
    name: "AI Support",
    summary: "Ticket triage, knowledge suggestions, and faster resolution paths.",
  },
  {
    name: "AI Operations",
    summary: "Throughput, kitchen, inventory, and service-level situational awareness.",
  },
  {
    name: "AI Analytics",
    summary: "Narrative explanations on top of live dashboards and reports.",
  },
  {
    name: "AI Assistant",
    summary: "A conversational layer over your business knowledge and workflows.",
  },
] as const;

export const INDUSTRIES = [
  {
    name: "Restaurants",
    summary: "Menus, QR, kitchen, reservations, loyalty—built for service pressure.",
  },
  { name: "Retail", summary: "Catalog, inventory, checkout, and customer retention in sync." },
  { name: "Hotels", summary: "Guest journeys, operations, and service coordination." },
  { name: "Clinics", summary: "Appointments, records workflows, and front-desk clarity." },
  { name: "Salons", summary: "Bookings, staff, retail add-ons, and repeat visits." },
  { name: "Gyms", summary: "Memberships, scheduling, and member engagement." },
  { name: "Education", summary: "Enrollment, communications, and operational oversight." },
  { name: "Construction", summary: "Projects, suppliers, and field-to-office continuity." },
  { name: "Manufacturing", summary: "Inventory, supply, and production-aware operations." },
  { name: "Real Estate", summary: "Pipeline, documents, and client communication." },
  {
    name: "Professional Services",
    summary: "CRM, delivery, billing, and client portals for service firms.",
  },
] as const;

const PRICING_PLAN_HIGHLIGHTS: Record<
  string,
  { summary: string; highlights: string[]; featured: boolean }
> = {
  [BUSAL_COMMERCIAL_PLAN_SLUGS.CORE]: {
    summary: "Core operations for a single location ready to run professionally.",
    highlights: ["Core modules", "Business Admin", "Email support", "Standard AI assistant"],
    featured: false,
  },
  [BUSAL_COMMERCIAL_PLAN_SLUGS.GROWTH]: {
    summary: "Multi-branch growth with deeper CRM, marketing, and analytics.",
    highlights: [
      "Everything in Core",
      "Multi-branch",
      "CRM & loyalty",
      "Marketing campaigns",
      "Priority support",
    ],
    featured: true,
  },
  [BUSAL_COMMERCIAL_PLAN_SLUGS.PRO]: {
    summary: "Advanced AI agents, automation, and stronger operational controls.",
    highlights: [
      "Everything in Growth",
      "Full AI agent suite",
      "Automation platform",
      "Advanced reporting",
      "Dedicated onboarding",
    ],
    featured: false,
  },
  [BUSAL_COMMERCIAL_PLAN_SLUGS.ENTERPRISE]: {
    summary: "Platform scale, governance, and commercial terms for complex groups.",
    highlights: [
      "Everything in Pro",
      "SSO & enterprise controls",
      "Custom SLAs",
      "Dedicated success",
      "Volume pricing",
    ],
    featured: false,
  },
};

export const PRICING = {
  implementation: {
    title: "One-time implementation",
    range: "£3,000–£4,000",
    summary:
      "Discovery, configuration, data setup, training, and go-live support tailored to your business.",
  },
  plans: listPublicCommercialPlans().map((plan) => {
    const copy = PRICING_PLAN_HIGHLIGHTS[plan.slug] ?? {
      summary: plan.description,
      highlights: plan.features,
      featured: false,
    };
    const monthly = getCommercialPlanMonthlyAmount(plan);

    return {
      id: plan.slug,
      name: plan.name,
      price: plan.customPricing ? "Custom" : `£${monthly}`,
      period: plan.customPricing ? "" : "/month",
      summary: copy.summary,
      highlights: copy.highlights,
      featured: copy.featured,
    };
  }),
} as const;

export const JOURNEY = [
  {
    step: "01",
    title: "Discover Busal",
    summary: "See how one operating system replaces fragmented tools.",
  },
  {
    step: "02",
    title: "Book a demo",
    summary: "Walk through your workflows with a Busal specialist.",
  },
  {
    step: "03",
    title: "Business analysis",
    summary: "We map branches, roles, menus, and operational priorities.",
  },
  {
    step: "04",
    title: "Implementation",
    summary: "Configuration, data, integrations, and environment readiness.",
  },
  {
    step: "05",
    title: "Training",
    summary: "Managers and teams learn the rhythms that stick.",
  },
  { step: "06", title: "Go live", summary: "Launch with confidence and hands-on support." },
  {
    step: "07",
    title: "Business growth",
    summary: "Optimize with AI, analytics, and continuous success.",
  },
] as const;

export const TESTIMONIALS = [
  {
    quote:
      "We stopped juggling five systems. Orders, kitchen, and loyalty finally speak the same language.",
    name: "Amira Hassan",
    role: "Owner, coastal restaurant group",
  },
  {
    quote:
      "The AI briefings save our morning stand-up. We know what matters before the doors open.",
    name: "James Okonkwo",
    role: "Operations Director",
  },
  {
    quote:
      "Implementation felt like a partnership, not a software dump. Our team was ready on day one.",
    name: "Sofia Mendes",
    role: "General Manager",
  },
] as const;

export const INTEGRATIONS = [
  "Payments",
  "Email",
  "SMS",
  "Accounting exports",
  "Webhooks",
  "API gateway",
  "Document storage",
  "Identity providers",
] as const;

export const SECURITY_POINTS = [
  {
    title: "Tenant isolation",
    summary: "Business data is scoped by design—roles, branches, and permissions enforced.",
  },
  {
    title: "Secure authentication",
    summary: "Modern session handling with enterprise-ready access controls.",
  },
  {
    title: "Audit trails",
    summary: "Operational and platform actions leave a trail you can review.",
  },
  {
    title: "Production hardening",
    summary: "HTTPS, hardened headers, and continuous monitoring pathways.",
  },
] as const;

export const FAQ_ITEMS = [
  {
    q: "Is Busal OS only for restaurants?",
    a: "Restaurants are our deepest vertical today, but the architecture is industry-ready. Retail, hospitality, clinics, and professional services are on the same foundation.",
  },
  {
    q: "What does implementation include?",
    a: "Discovery, configuration, core data setup, role mapping, training, and go-live support. Scope is confirmed after business analysis.",
  },
  {
    q: "Can we start with one location?",
    a: "Yes. Most customers begin with a single branch, then expand modules and locations as operations mature.",
  },
  {
    q: "How does AI use our data?",
    a: "AI agents operate within your business context to produce recommendations and assistance. Access follows your existing permission model.",
  },
  {
    q: "Do you replace our POS and CRM?",
    a: "Busal is designed as the operating system—POS, CRM, inventory, kitchen, and customer portal work together natively.",
  },
  {
    q: "How do subscriptions work?",
    a: "Plans are monthly after a one-time implementation. Enterprise terms are available for multi-entity groups.",
  },
] as const;

export const BLOG_POSTS = [
  {
    slug: "operating-system-vs-tool-stack",
    title: "Why growing businesses outgrow tool stacks",
    excerpt:
      "When POS, CRM, and inventory disagree, operations pay the tax. An OS approach changes the economics.",
    date: "2026-06-12",
  },
  {
    slug: "ai-that-knows-your-service",
    title: "AI that understands service pressure",
    excerpt:
      "Generic copilots are polite. Domain agents that see kitchen queues and loyalty data are useful.",
    date: "2026-05-28",
  },
  {
    slug: "implementation-that-sticks",
    title: "Implementation that sticks after go-live",
    excerpt:
      "Software launches fail in the first two weeks. Training and operating rhythms decide the outcome.",
    date: "2026-05-04",
  },
  {
    slug: "ai-for-restaurants",
    title: "AI for restaurants: from hype to pre-service intelligence",
    excerpt:
      "How domain agents turn kitchen queues, covers, and margin signals into briefings managers act on before the rush.",
    date: "2026-07-22",
  },
  {
    slug: "retail-automation-without-chaos",
    title: "Retail automation without operational chaos",
    excerpt:
      "Automate replenishment, checkout, and CRM segments without losing the human judgment that protects margin.",
    date: "2026-07-08",
  },
  {
    slug: "business-intelligence-for-operators",
    title: "Business intelligence built for operators, not analysts",
    excerpt:
      "Dashboards fail when they arrive after close. Live intelligence means decisions during service—not after.",
    date: "2026-06-28",
  },
  {
    slug: "inventory-optimization-guide",
    title: "Inventory optimization without spreadsheet drift",
    excerpt:
      "Purchase orders, low-stock alerts, and supplier continuity when sell-through and kitchen usage share one ledger.",
    date: "2026-06-18",
  },
  {
    slug: "crm-best-practices-service",
    title: "CRM best practices for service businesses",
    excerpt:
      "Guest profiles, loyalty, and marketing segments grounded in every visit—not exported CSVs.",
    date: "2026-05-18",
  },
  {
    slug: "staff-management-modern-ops",
    title: "Staff management for modern multi-branch operations",
    excerpt:
      "Roles, permissions, rosters, and accountability when every location runs live service on one platform.",
    date: "2026-05-08",
  },
  {
    slug: "analytics-that-drive-decisions",
    title: "Business analytics that drive same-day decisions",
    excerpt:
      "From revenue mix to labour efficiency—metrics operators can act on before the shift ends.",
    date: "2026-04-22",
  },
  {
    slug: "customer-loyalty-that-compounds",
    title: "Customer loyalty programs that compound over time",
    excerpt:
      "Rewards, portal access, and retention loops tied to live order and visit data—not batch campaigns.",
    date: "2026-04-08",
  },
  {
    slug: "security-by-design-operators",
    title: "Security by design for growing operators",
    excerpt:
      "Encryption, tenant isolation, audit logs, and access controls that scale with multi-location growth.",
    date: "2026-03-25",
  },
  {
    slug: "busal-platform-summer-2026",
    title: "Busal Platform Summer 2026: what we shipped",
    excerpt:
      "AI Manager briefings, multi-location dashboard, predictive inventory, and customer portal refresh—now live.",
    date: "2026-08-01",
  },
] as const;

export const HELP_TOPICS = [
  { title: "Getting started", summary: "Accounts, onboarding, and first-week checklists." },
  { title: "Orders & kitchen", summary: "POS, QR, kitchen display, and service flow." },
  { title: "Customers & loyalty", summary: "CRM, rewards, and the customer portal." },
  { title: "Inventory & suppliers", summary: "Stock, purchase orders, and low-stock alerts." },
  { title: "AI & automation", summary: "Agents, assistants, and workflow automation." },
  { title: "Billing & plans", summary: "Subscriptions, invoices, and plan changes." },
] as const;

export const CAREERS = [
  {
    title: "Customer Success Manager",
    location: "Remote / UK",
    type: "Full-time",
    summary: "Guide restaurants from implementation to measurable growth.",
  },
  {
    title: "Implementation Specialist",
    location: "Remote / UK",
    type: "Full-time",
    summary: "Configure Busal OS for real-world service businesses.",
  },
  {
    title: "Full-Stack Engineer",
    location: "Remote",
    type: "Full-time",
    summary: "Build the AI-first operating system used by multi-branch teams.",
  },
] as const;

export const CUSTOMER_LOGOS = [
  {
    name: "Harbour Kitchen Group",
    mark: "HK",
    gradient: "linear-gradient(135deg, #3b82f6, #6366f1)",
  },
  { name: "Northline Retail", mark: "NR", gradient: "linear-gradient(135deg, #8b5cf6, #a855f7)" },
  { name: "Atlas Clinics", mark: "AC", gradient: "linear-gradient(135deg, #06b6d4, #3b82f6)" },
  { name: "Velvet Salons", mark: "VS", gradient: "linear-gradient(135deg, #ec4899, #8b5cf6)" },
  { name: "Forge Fitness", mark: "FF", gradient: "linear-gradient(135deg, #f97316, #ef4444)" },
  { name: "Summit Hospitality", mark: "SH", gradient: "linear-gradient(135deg, #10b981, #059669)" },
] as const;

export const SOCIAL_LINKS = [
  { label: "LinkedIn", href: "https://www.linkedin.com/company/busal-os" },
  { label: "Facebook", href: "https://www.facebook.com/getbusal" },
  { label: "X", href: "https://x.com/getbusal" },
  { label: "YouTube", href: "https://www.youtube.com/@getbusal" },
] as const;

export const CONTACT_OFFICE = {
  company: "Busal Ltd",
  lines: ["71-75 Shelton Street", "Covent Garden", "London, WC2H 9JQ", "United Kingdom"],
  mapEmbedUrl:
    "https://www.openstreetmap.org/export/embed.html?bbox=-0.1285%2C51.5125%2C-0.1205%2C51.5165&layer=mapnik&marker=51.5145%2C-0.1245",
  mapLinkUrl: "https://www.openstreetmap.org/?mlat=51.5145&mlon=-0.1245#map=17/51.5145/-0.1245",
} as const;

export const IMPLEMENTATION_TIMELINE = [
  {
    week: "Week 1",
    title: "Discovery & blueprint",
    summary: "Workshops on branches, roles, menus, inventory, and success metrics.",
  },
  {
    week: "Week 2–3",
    title: "Configuration & data",
    summary: "Environment setup, catalog, permissions, and core operational flows.",
  },
  {
    week: "Week 4",
    title: "Training & rehearsal",
    summary: "Manager and floor training with dry-run service scenarios.",
  },
  {
    week: "Go-live",
    title: "Launch with support",
    summary: "Hands-on go-live coverage and a 30-day optimisation window.",
  },
] as const;

export const AI_ROADMAP = [
  {
    phase: "Now",
    title: "Domain agents in production",
    summary: "CEO, sales, marketing, finance, HR, support, operations, analytics, and assistant.",
  },
  {
    phase: "Next",
    title: "Deeper orchestration",
    summary: "Multi-agent workflows that propose actions across modules with human approval.",
  },
  {
    phase: "Soon",
    title: "Voice & floor copilots",
    summary: "Hands-free assistance for managers and kitchen leads during service.",
  },
  {
    phase: "Vision",
    title: "Industry copilots",
    summary: "Vertical specialists that understand clinic, hotel, and retail rhythms natively.",
  },
] as const;

export const CASE_STUDIES = [
  {
    industry: "Restaurants",
    company: "Harbour Kitchen Group",
    metric: "38%",
    metricLabel: "faster ticket times",
    summary:
      "Unified POS, kitchen display, and loyalty across three coastal sites—ending spreadsheet handoffs between front and back of house.",
    outcomes: ["Single order truth", "Live kitchen queue", "Loyalty tied to every cover"],
  },
  {
    industry: "Retail",
    company: "Northline Retail",
    metric: "22%",
    metricLabel: "fewer stockouts",
    summary:
      "Inventory, checkout, and CRM share one ledger so replenishment decisions follow real sell-through—not end-of-week exports.",
    outcomes: ["Live stock signals", "Customer retention loops", "Branch-level visibility"],
  },
  {
    industry: "Clinics",
    company: "Atlas Clinics",
    metric: "2.1×",
    metricLabel: "faster front-desk flow",
    summary:
      "Appointments, customer records, and follow-ups live in one operating rhythm—reducing phone tag and missed confirmations.",
    outcomes: ["Clear booking status", "Staff role clarity", "Patient communication trail"],
  },
] as const;

export const INDUSTRY_DETAILS = [
  {
    name: "Restaurants",
    summary: "Menus, QR, kitchen, reservations, loyalty—built for service pressure.",
    benefits: [
      "Orders flow from POS and QR into one kitchen queue",
      "Reservations, covers, and guest history stay connected",
      "AI briefings surface demand, stock, and VIP risk before service",
    ],
  },
  {
    name: "Retail",
    summary: "Catalog, inventory, checkout, and customer retention in sync.",
    benefits: [
      "Sell-through drives replenishment without spreadsheet lag",
      "Loyalty and CRM sit beside every basket",
      "Multi-branch inventory with role-aware controls",
    ],
  },
  {
    name: "Hotels",
    summary: "Guest journeys, operations, and service coordination.",
    benefits: [
      "Guest preferences follow the stay, not the department",
      "Ops and finance share one commercial picture",
      "Support tickets escalate with full context",
    ],
  },
  {
    name: "Clinics",
    summary: "Appointments, records workflows, and front-desk clarity.",
    benefits: [
      "Booking and follow-up in one operational thread",
      "Staff permissions keep sensitive workflows controlled",
      "Analytics that respect clinic day patterns",
    ],
  },
  {
    name: "Salons",
    summary: "Bookings, staff, retail add-ons, and repeat visits.",
    benefits: [
      "Chair utilisation and retail attach in one view",
      "Client history informs every appointment",
      "Campaigns grounded in real visit data",
    ],
  },
  {
    name: "Gyms",
    summary: "Memberships, scheduling, and member engagement.",
    benefits: [
      "Memberships, classes, and CRM share one record",
      "Retention signals before churn becomes obvious",
      "Staff scheduling aligned to peak demand",
    ],
  },
  {
    name: "Education",
    summary: "Enrollment, communications, and operational oversight.",
    benefits: [
      "Enrollment pipelines with clear next actions",
      "Communications tied to learner context",
      "Admin reporting without tool sprawl",
    ],
  },
  {
    name: "Construction",
    summary: "Projects, suppliers, and field-to-office continuity.",
    benefits: [
      "Supplier and inventory continuity for project teams",
      "Documents and decisions in one place",
      "Commercial visibility across active jobs",
    ],
  },
  {
    name: "Manufacturing",
    summary: "Inventory, supply, and production-aware operations.",
    benefits: [
      "Stock and purchase orders that match production reality",
      "Cost signals that surface early",
      "Role-based access across plant and office",
    ],
  },
  {
    name: "Real Estate",
    summary: "Pipeline, documents, and client communication.",
    benefits: [
      "Pipeline stages with document continuity",
      "Client portals for self-serve updates",
      "Team visibility without email archaeology",
    ],
  },
  {
    name: "Professional Services",
    summary: "CRM, delivery, billing, and client portals for service firms.",
    benefits: [
      "Clients, delivery, and invoices on one timeline",
      "Portal access that reduces status chases",
      "AI that briefs partners on portfolio health",
    ],
  },
] as const;

export const HELP_ARTICLES = [
  {
    topic: "Getting started",
    title: "Complete business onboarding",
    summary: "Create your business, invite managers, and configure your first location.",
  },
  {
    topic: "Getting started",
    title: "Invite your team securely",
    summary: "Roles, permissions, and first-week access best practices.",
  },
  {
    topic: "Orders & kitchen",
    title: "Run a live service day",
    summary: "POS, QR ordering, and kitchen display working as one queue.",
  },
  {
    topic: "Customers & loyalty",
    title: "Connect CRM to every cover",
    summary: "Capture guests, rewards, and portal access without double entry.",
  },
  {
    topic: "Inventory & suppliers",
    title: "Prevent stockouts before service",
    summary: "Purchase orders, low-stock alerts, and supplier continuity.",
  },
  {
    topic: "AI & automation",
    title: "Use the morning AI briefing",
    summary: "How domain agents surface risks and priorities from live data.",
  },
  {
    topic: "Billing & plans",
    title: "Understand plans and invoices",
    summary: "Starter through Enterprise, implementation fees, and billing cadence.",
  },
] as const;

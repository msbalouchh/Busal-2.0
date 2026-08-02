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

export const SUCCESS_STORIES = [
  {
    industry: "Restaurant",
    title: "Harbour Kitchen Group",
    logoMark: "HK",
    logoGradient: "linear-gradient(135deg, #3b82f6, #6366f1)",
    businessSize: "3 locations · 800+ daily covers",
    overview:
      "Three-site coastal restaurant group serving 800+ covers daily across dine-in and delivery.",
    challenges:
      "Kitchen bottlenecks, disconnected POS and loyalty, margin blind spots until month-end.",
    implementation:
      "Unified POS, kitchen display, reservations, and CRM with AI Manager briefings before service.",
    results:
      "Single order truth, faster ticket times, and loyalty tied to every cover without spreadsheet drift.",
    revenue: "+22% revenue",
    timeSaved: "16 hrs/week saved",
    efficiency: "+38% ticket speed",
    ai: ["AI Manager", "AI Inventory", "AI Waiter"],
  },
  {
    industry: "Retail Store",
    title: "Northline Retail",
    logoMark: "NR",
    logoGradient: "linear-gradient(135deg, #8b5cf6, #a855f7)",
    businessSize: "5 branches · 12k SKUs",
    overview:
      "Multi-branch fashion and lifestyle retail with high SKU velocity and seasonal peaks.",
    challenges:
      "Stockouts on bestsellers, sell-through data arriving too late, CRM disconnected from checkout.",
    implementation:
      "Inventory, POS, and CRM on one ledger with AI replenishment and marketing segments.",
    results: "Live stock signals, fewer stockouts, and retention loops grounded in basket data.",
    revenue: "+18% sell-through",
    timeSaved: "12 hrs/week saved",
    efficiency: "22% fewer stockouts",
    ai: ["AI Inventory", "AI Marketing", "AI Analytics"],
  },
  {
    industry: "Salon",
    title: "Velvet Salons",
    logoMark: "VS",
    logoGradient: "linear-gradient(135deg, #ec4899, #8b5cf6)",
    businessSize: "4 salons · 60 chairs",
    overview: "Premium salon chain with chair utilisation, retail attach, and repeat visit goals.",
    challenges:
      "Empty chairs between bookings, client history scattered, campaigns not tied to visit data.",
    implementation:
      "Appointments, CRM, payments, and marketing automation with AI rebooking nudges.",
    results:
      "Higher chair utilisation, stronger retail attach, and 31% rebooking lift in six months.",
    revenue: "+31% rebooking",
    timeSaved: "10 hrs/week saved",
    efficiency: "+24% chair utilisation",
    ai: ["AI Receptionist", "AI Marketing", "AI Manager"],
  },
  {
    industry: "Clinic",
    title: "Atlas Clinics",
    logoMark: "AC",
    logoGradient: "linear-gradient(135deg, #06b6d4, #3b82f6)",
    businessSize: "2 clinics · 18 practitioners",
    overview: "Multi-practitioner clinic with high front-desk volume and follow-up coordination.",
    challenges:
      "Phone tag for confirmations, front desk overwhelmed, follow-ups falling through cracks.",
    implementation:
      "Appointments, patient CRM, billing, and AI Receptionist for booking queries and reminders.",
    results:
      "2.1× faster front-desk flow, clear booking status, and automated patient follow-up trails.",
    revenue: "+15% capacity",
    timeSaved: "14 hrs/week saved",
    efficiency: "2.1× front-desk flow",
    ai: ["AI Receptionist", "AI Support", "AI Analytics"],
  },
  {
    industry: "Gym",
    title: "Forge Fitness",
    logoMark: "FF",
    logoGradient: "linear-gradient(135deg, #f97316, #ef4444)",
    businessSize: "6 gyms · 4,200 members",
    overview: "Growing gym group with memberships, classes, and retention-focused operations.",
    challenges:
      "Churn visible only after cancellation, scheduling conflicts, billing disputes manual.",
    implementation:
      "Memberships, scheduling, CRM, and portal with AI retention signals before churn.",
    results:
      "Retention alerts weeks earlier, smoother billing, and class scheduling aligned to demand.",
    revenue: "+19% retention",
    timeSaved: "11 hrs/week saved",
    efficiency: "+26% class fill rate",
    ai: ["AI Manager", "AI Marketing", "AI Finance"],
  },
  {
    industry: "Hotel",
    title: "Summit Hospitality",
    logoMark: "SH",
    logoGradient: "linear-gradient(135deg, #10b981, #059669)",
    businessSize: "3 boutique hotels · 210 rooms",
    overview:
      "Boutique hotel group coordinating F&B, front desk, and guest preferences across stays.",
    challenges:
      "Guest preferences lost between departments, RevPAR insights late, ops and finance split.",
    implementation: "Reservations, CRM, POS, housekeeping workflows, and AI guest intelligence.",
    results:
      "Guest profiles follow the stay, unified commercial view, and proactive service coordination.",
    revenue: "+17% RevPAR",
    timeSaved: "20 hrs/week saved",
    efficiency: "+21% guest satisfaction",
    ai: ["AI Manager", "AI Operations", "AI Marketing"],
  },
] as const;

export const SUCCESS_TESTIMONIALS = [
  {
    initials: "AH",
    quote:
      "We stopped juggling five systems. Orders, kitchen, and loyalty finally speak the same language.",
    name: "Amira Hassan",
    role: "Owner · Harbour Kitchen Group",
    company: "Harbour Kitchen Group",
    logoMark: "HK",
    logoGradient: "linear-gradient(135deg, #3b82f6, #6366f1)",
  },
  {
    initials: "JO",
    quote:
      "The AI briefings save our morning stand-up. We know what matters before the doors open.",
    name: "James Okonkwo",
    role: "Operations Director · Northline Retail",
    company: "Northline Retail",
    logoMark: "NR",
    logoGradient: "linear-gradient(135deg, #8b5cf6, #a855f7)",
  },
  {
    initials: "SM",
    quote:
      "Implementation felt like a partnership, not a software dump. Our team was ready on day one.",
    name: "Sofia Mendes",
    role: "General Manager · Summit Hospitality",
    company: "Summit Hospitality",
    logoMark: "SH",
    logoGradient: "linear-gradient(135deg, #10b981, #059669)",
  },
] as const;

export const DEMO_TIMEZONES = [
  { value: "Europe/London", label: "GMT — London" },
  { value: "Europe/Paris", label: "CET — Paris" },
  { value: "America/New_York", label: "EST — New York" },
  { value: "America/Chicago", label: "CST — Chicago" },
  { value: "America/Denver", label: "MST — Denver" },
  { value: "America/Los_Angeles", label: "PST — Los Angeles" },
  { value: "Asia/Dubai", label: "GST — Dubai" },
  { value: "Asia/Singapore", label: "SGT — Singapore" },
  { value: "Australia/Sydney", label: "AEST — Sydney" },
] as const;

export const DEMO_TIME_SLOTS = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
] as const;

export const DEMO_INDUSTRIES = [
  "Restaurant",
  "Retail",
  "Healthcare",
  "Hospitality",
  "Professional Services",
  "Logistics",
  "Education",
  "Salon & Beauty",
  "Gym & Fitness",
  "Other",
] as const;

export const DEMO_INTERESTS = [
  "Restaurant Operations",
  "POS",
  "Inventory",
  "CRM",
  "Reservations",
  "QR Ordering",
  "Kitchen Display",
  "Analytics",
  "AI Employees",
  "Marketing",
  "Automation",
  "Multi-location",
  "Custom Integrations",
] as const;

export const DEMO_NEXT_STEPS = [
  {
    step: "Book Demo",
    desc: "Choose your preferred date and time with a Busal specialist.",
  },
  {
    step: "Meet Busal Expert",
    desc: "A platform specialist reviews your business context before the session.",
  },
  {
    step: "Business Analysis",
    desc: "We map your operations, pain points, and current software stack.",
  },
  {
    step: "Live Product Demo",
    desc: "30-minute tailored walkthrough of the modules that matter to you.",
  },
  {
    step: "Custom Solution",
    desc: "Receive a recommended configuration and implementation approach.",
  },
  {
    step: "Onboarding",
    desc: "Structured go-live plan with training, migration, and success support.",
  },
] as const;

export const DEMO_BENEFITS = [
  {
    title: "30-minute live demo",
    desc: "Focused session on your workflows—not a generic slide deck.",
  },
  {
    title: "Business-specific walkthrough",
    desc: "See POS, CRM, kitchen, AI, and ops mapped to your industry.",
  },
  {
    title: "AI recommendations",
    desc: "Discover which AI agents and automations fit your operation first.",
  },
  {
    title: "Migration discussion",
    desc: "Understand data migration scope from your current tools.",
  },
  {
    title: "Pricing consultation",
    desc: "Transparent plan guidance based on locations and team size.",
  },
  {
    title: "Implementation roadmap",
    desc: "Leave with a clear path from demo to go-live.",
  },
] as const;

export const DEMO_TRUST = [
  {
    title: "Enterprise-grade security",
    desc: "Tenant isolation, encryption, and role-based access controls.",
  },
  {
    title: "99.99% uptime",
    desc: "Production-grade cloud infrastructure operators depend on.",
  },
  {
    title: "Cloud platform",
    desc: "Zero server maintenance—always on, always updated.",
  },
  {
    title: "AI-powered automation",
    desc: "Domain agents running on live operational data.",
  },
  {
    title: "Fast onboarding",
    desc: "Most businesses go live within four weeks of discovery.",
  },
] as const;

export const DEMO_FAQ = [
  {
    q: "How long is the demo?",
    a: "Demos run 30 minutes—a focused live walkthrough of Busal OS tailored to your business. We leave time for questions on pricing, migration, and implementation.",
  },
  {
    q: "Is it free?",
    a: "Yes. Product demonstrations are completely free with no obligation. We want you to see Busal in your context before making any commitment.",
  },
  {
    q: "Can my team join?",
    a: "Absolutely. Share the calendar invite with managers, ops leads, or IT—we encourage decision-makers and day-to-day operators to attend together.",
  },
  {
    q: "Can you migrate my current system?",
    a: "Yes. Our team migrates customers, products, menus, staff roles, and historical records where available. Scope is confirmed during business discovery.",
  },
  {
    q: "Do you offer onboarding?",
    a: "Structured implementation is included—discovery, configuration, training, and go-live support. Enterprise plans add dedicated account management.",
  },
  {
    q: "What industries do you support?",
    a: "Restaurants, retail, healthcare, hospitality, professional services, logistics, education, salons, gyms, and more—all on one unified AI operating system.",
  },
] as const;

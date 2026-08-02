export const CONTACT_INDUSTRIES = [
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

export const CONTACT_REASONS = [
  { value: "sales", label: "Sales" },
  { value: "support", label: "Support" },
  { value: "partnership", label: "Partnership" },
  { value: "enterprise", label: "Enterprise" },
  { value: "media", label: "Media" },
] as const;

export const CONTACT_OPTIONS = [
  {
    title: "Sales",
    email: "sales@getbusal.com",
    href: "mailto:sales@getbusal.com",
    desc: "Demos, pricing, and new business enquiries.",
    response: "Response within 1 business day",
  },
  {
    title: "Customer Success",
    email: "success@getbusal.com",
    href: "mailto:success@getbusal.com",
    desc: "Onboarding, adoption, and ongoing account growth.",
    response: "Response within 4 business hours",
  },
  {
    title: "Technical Support",
    email: "support@getbusal.com",
    href: "mailto:support@getbusal.com",
    desc: "Platform issues, integrations, and live-site priority.",
    response: "Mon–Fri · Priority for live operations",
  },
  {
    title: "Partnerships",
    email: "partners@getbusal.com",
    href: "mailto:partners@getbusal.com",
    desc: "Resellers, integrators, and technology alliances.",
    response: "Response within 2 business days",
  },
  {
    title: "Careers",
    email: "careers@getbusal.com",
    href: "mailto:careers@getbusal.com",
    desc: "Join the team building the future of business software.",
    response: "Response within 5 business days",
  },
] as const;

export const CONTACT_REGIONS = [
  { label: "London HQ", x: 48, y: 32, status: "current" as const },
  { label: "United Kingdom", x: 46, y: 30, status: "current" as const },
  { label: "Europe", x: 52, y: 34, status: "current" as const },
  { label: "Middle East", x: 58, y: 48, status: "expansion" as const },
  { label: "North America", x: 22, y: 38, status: "expansion" as const },
  { label: "Asia Pacific", x: 78, y: 52, status: "expansion" as const },
] as const;

export const CONTACT_HOURS = [
  {
    title: "Business hours",
    detail: "Monday – Friday, 9:00 – 17:30 GMT",
    note: "Sales, success, and general enquiries.",
  },
  {
    title: "Support availability",
    detail: "Monday – Friday, extended hours for live sites",
    note: "Priority response for production operations.",
  },
  {
    title: "Emergency enterprise support",
    detail: "24/7 for Enterprise customers",
    note: "Critical incident escalation with dedicated SLA.",
  },
] as const;

export const CONTACT_FAQ = [
  {
    q: "How quickly will I hear back?",
    a: "Sales enquiries typically receive a response within one business day. Support requests from live customers are prioritised—often within four hours during business days.",
  },
  {
    q: "Which email should I use?",
    a: "Use sales@getbusal.com for demos and pricing, support@getbusal.com for technical issues, partners@getbusal.com for partnerships, and careers@getbusal.com for roles.",
  },
  {
    q: "Can I book a demo instead of emailing?",
    a: "Yes. If you'd prefer a live walkthrough, book a 30-minute demo directly—we'll tailor the session to your business and industry.",
  },
  {
    q: "Do you offer enterprise SLAs?",
    a: "Enterprise plans include dedicated account management, 24/7 critical incident support, and custom implementation timelines. Contact sales for enterprise enquiries.",
  },
  {
    q: "Where is Busal headquartered?",
    a: "Busal Ltd is headquartered in London, UK, with a remote-first team serving businesses globally. We operate cloud infrastructure across regions for low-latency access.",
  },
  {
    q: "Can my whole team join a call?",
    a: "Absolutely. We encourage operators, managers, and IT stakeholders to join demos and discovery calls together.",
  },
] as const;

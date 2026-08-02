export const HELP_QUICK_ACTIONS = [
  { label: "Getting Started", href: "#popular-topics", topic: "Setup" },
  { label: "Integrations", href: "#categories", topic: "Integrations" },
  { label: "Billing", href: "#categories", topic: "Payments" },
  { label: "Security", href: "#categories", topic: "Security" },
  { label: "AI", href: "#categories", topic: "AI Agents" },
  { label: "Account", href: "#still-need-help", topic: "Setup" },
] as const;

export const HELP_POPULAR_TOPICS = [
  {
    title: "Complete business onboarding",
    summary: "Create your business, invite managers, and configure your first location.",
    icon: "rocket",
  },
  {
    title: "Run a live service day",
    summary: "POS, QR ordering, and kitchen display working as one queue.",
    icon: "pos",
  },
  {
    title: "Connect CRM to every cover",
    summary: "Capture guests, rewards, and portal access without double entry.",
    icon: "crm",
  },
  {
    title: "Configure AI agents",
    summary: "Set up domain agents for manager, reception, and operations briefings.",
    icon: "ai",
  },
  {
    title: "Manage subscriptions",
    summary: "Plans, invoices, billing contacts, and payment methods.",
    icon: "billing",
  },
  {
    title: "Multi-location setup",
    summary: "Branch hierarchy, permissions, and consolidated reporting.",
    icon: "business",
  },
] as const;

export const HELP_CATEGORIES = [
  { title: "Setup", desc: "Onboarding, accounts, and first-week checklists.", articles: 12 },
  { title: "Business", desc: "Locations, roles, permissions, and org settings.", articles: 9 },
  { title: "Restaurants", desc: "Service flow, kitchen, reservations, and F&B.", articles: 14 },
  { title: "POS", desc: "Checkout, QR ordering, payments, and receipts.", articles: 11 },
  { title: "CRM", desc: "Guests, loyalty, marketing segments, and portal.", articles: 10 },
  { title: "AI Agents", desc: "Manager, reception, marketing, and ops agents.", articles: 8 },
  { title: "Automation", desc: "Workflows, triggers, and cross-module rules.", articles: 7 },
  { title: "Integrations", desc: "Accounting, payments, and third-party tools.", articles: 9 },
  { title: "Payments", desc: "Billing, subscriptions, invoices, and plans.", articles: 6 },
  { title: "Analytics", desc: "Reports, dashboards, and operational intelligence.", articles: 8 },
  { title: "Security", desc: "Roles, encryption, audit logs, and compliance.", articles: 7 },
  {
    title: "Troubleshooting",
    desc: "Common issues, diagnostics, and recovery steps.",
    articles: 11,
  },
] as const;

export const HELP_FEATURED_GUIDES = [
  {
    title: "Complete business onboarding",
    topic: "Setup",
    readTime: "8 min",
    summary: "Create your business, invite managers, and configure your first location.",
  },
  {
    title: "Invite your team securely",
    topic: "Setup",
    readTime: "5 min",
    summary: "Roles, permissions, and first-week access best practices.",
  },
  {
    title: "Run a live service day",
    topic: "POS",
    readTime: "12 min",
    summary: "POS, QR ordering, and kitchen display working as one queue.",
  },
  {
    title: "Prevent stockouts before service",
    topic: "Inventory",
    readTime: "7 min",
    summary: "Purchase orders, low-stock alerts, and supplier continuity.",
  },
  {
    title: "Deploy AI Manager briefings",
    topic: "AI Agents",
    readTime: "6 min",
    summary: "Pre-service intelligence summaries for managers and floor leads.",
  },
  {
    title: "Connect accounting exports",
    topic: "Integrations",
    readTime: "9 min",
    summary: "Sync revenue, VAT, and ledger entries with your accounting stack.",
  },
] as const;

export const HELP_VIDEOS = [
  {
    title: "Busal OS overview",
    duration: "10:24",
    topic: "Getting started",
    gradient: "linear-gradient(145deg, #3b82f6, #6366f1)",
  },
  {
    title: "POS & kitchen workflow",
    duration: "8:15",
    topic: "Restaurants",
    gradient: "linear-gradient(145deg, #f97316, #ef4444)",
  },
  {
    title: "AI agents in practice",
    duration: "7:42",
    topic: "AI Agents",
    gradient: "linear-gradient(145deg, #8b5cf6, #a855f7)",
  },
  {
    title: "Multi-location dashboard",
    duration: "6:30",
    topic: "Business",
    gradient: "linear-gradient(145deg, #06b6d4, #3b82f6)",
  },
] as const;

export const HELP_DEV_DOCS = [
  {
    title: "API",
    desc: "REST endpoints for orders, customers, inventory, and webhooks.",
    href: "/resources",
  },
  {
    title: "SDK",
    desc: "TypeScript and Python SDKs for custom integrations.",
    href: "/resources",
  },
  {
    title: "Webhooks",
    desc: "Real-time events for orders, payments, and inventory changes.",
    href: "/resources",
  },
  {
    title: "Authentication",
    desc: "API keys, OAuth, and tenant-scoped access tokens.",
    href: "/resources",
  },
  {
    title: "Integrations",
    desc: "Connect payments, accounting, and marketing platforms.",
    href: "/platform",
  },
] as const;

export const HELP_SUPPORT = [
  {
    title: "Live Chat",
    desc: "Chat with support during business hours for quick answers.",
    href: "/contact",
    response: "Typical reply under 5 minutes",
  },
  {
    title: "Email Support",
    desc: "support@getbusal.com for technical and account issues.",
    href: "mailto:support@getbusal.com",
    response: "Priority for live sites",
  },
  {
    title: "Book Demo",
    desc: "Guided walkthrough with a Busal platform specialist.",
    href: "/book-demo",
    response: "30-minute session",
  },
  {
    title: "Sales",
    desc: "Pricing, enterprise plans, and implementation scoping.",
    href: "/contact",
    response: "Response within 1 business day",
  },
] as const;

export const HELP_SEARCH_SUGGESTIONS = [
  "How do I onboard my team?",
  "Configure AI Manager",
  "Connect Stripe payments",
  "Multi-location permissions",
  "Kitchen display setup",
] as const;

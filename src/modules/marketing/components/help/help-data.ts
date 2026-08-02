import { HELP_ALL_GUIDES } from "@/modules/marketing/components/help/help-guides";

export {
  HELP_ALL_GUIDES,
  getHelpSearchItems,
} from "@/modules/marketing/components/help/help-guides";

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
  { title: "Setup", desc: "Onboarding, accounts, and first-week checklists.", articles: 4 },
  { title: "Business", desc: "Locations, roles, permissions, and org settings.", articles: 3 },
  { title: "Restaurants", desc: "Service flow, kitchen, reservations, and F&B.", articles: 4 },
  { title: "POS", desc: "Checkout, QR ordering, payments, and receipts.", articles: 3 },
  { title: "CRM", desc: "Guests, loyalty, marketing segments, and portal.", articles: 3 },
  { title: "AI Agents", desc: "Manager, reception, marketing, and ops agents.", articles: 3 },
  { title: "Automation", desc: "Workflows, triggers, and cross-module rules.", articles: 3 },
  { title: "Integrations", desc: "Accounting, payments, and third-party tools.", articles: 3 },
  { title: "Payments", desc: "Billing, subscriptions, invoices, and plans.", articles: 2 },
  { title: "Analytics", desc: "Reports, dashboards, and operational intelligence.", articles: 2 },
  { title: "Security", desc: "Roles, encryption, audit logs, and compliance.", articles: 2 },
  {
    title: "Troubleshooting",
    desc: "Common issues, diagnostics, and recovery steps.",
    articles: 4,
  },
] as const;

export const HELP_FEATURED_GUIDES = HELP_ALL_GUIDES.slice(0, 12);

export const HELP_VIDEOS = [
  {
    title: "Busal OS overview",
    duration: "10:24",
    topic: "Getting started",
    gradient: "linear-gradient(145deg, #3b82f6, #6366f1)",
    coverVariant: "product" as const,
  },
  {
    title: "POS & kitchen workflow",
    duration: "8:15",
    topic: "Restaurants",
    gradient: "linear-gradient(145deg, #f97316, #ef4444)",
    coverVariant: "restaurant" as const,
  },
  {
    title: "AI agents in practice",
    duration: "7:42",
    topic: "AI Agents",
    gradient: "linear-gradient(145deg, #8b5cf6, #a855f7)",
    coverVariant: "ai" as const,
  },
  {
    title: "Multi-location dashboard",
    duration: "6:30",
    topic: "Business",
    gradient: "linear-gradient(145deg, #06b6d4, #3b82f6)",
    coverVariant: "analytics" as const,
  },
  {
    title: "CRM & loyalty setup",
    duration: "5:48",
    topic: "CRM",
    gradient: "linear-gradient(145deg, #ec4899, #8b5cf6)",
    coverVariant: "crm" as const,
  },
  {
    title: "Inventory replenishment",
    duration: "6:12",
    topic: "Inventory",
    gradient: "linear-gradient(145deg, #6366f1, #8b5cf6)",
    coverVariant: "inventory" as const,
  },
  {
    title: "Security & permissions",
    duration: "4:55",
    topic: "Security",
    gradient: "linear-gradient(145deg, #1e293b, #475569)",
    coverVariant: "security" as const,
  },
  {
    title: "Integrations walkthrough",
    duration: "7:20",
    topic: "Integrations",
    gradient: "linear-gradient(145deg, #06b6d4, #6366f1)",
    coverVariant: "integration" as const,
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

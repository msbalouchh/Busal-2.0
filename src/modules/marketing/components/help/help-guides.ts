export type HelpGuide = {
  title: string;
  topic: string;
  readTime: string;
  summary: string;
  slug?: string;
};

export const HELP_ALL_GUIDES: readonly HelpGuide[] = [
  // Setup
  {
    title: "Complete business onboarding",
    topic: "Setup",
    readTime: "8 min",
    summary: "Create your business, invite managers, and configure your first location.",
    slug: "implementation-that-sticks",
  },
  {
    title: "Invite your team securely",
    topic: "Setup",
    readTime: "5 min",
    summary: "Roles, permissions, and first-week access best practices.",
  },
  {
    title: "First-week operator checklist",
    topic: "Setup",
    readTime: "6 min",
    summary: "Daily rhythms for managers during the first seven days on Busal.",
  },
  {
    title: "Configure branch hierarchy",
    topic: "Setup",
    readTime: "7 min",
    summary: "Parent business, locations, and permission inheritance explained.",
  },
  // Business
  {
    title: "Multi-location setup",
    topic: "Business",
    readTime: "10 min",
    summary: "Branch hierarchy, permissions, and consolidated reporting.",
  },
  {
    title: "Role templates for growing teams",
    topic: "Business",
    readTime: "6 min",
    summary: "Standard roles for floor, kitchen, finance, and management.",
    slug: "staff-management-modern-ops",
  },
  {
    title: "Org settings and audit logs",
    topic: "Business",
    readTime: "5 min",
    summary: "Track administrative actions across locations and users.",
  },
  // Restaurants
  {
    title: "Run a live service day",
    topic: "Restaurants",
    readTime: "12 min",
    summary: "POS, QR ordering, and kitchen display working as one queue.",
    slug: "ai-for-restaurants",
  },
  {
    title: "Reservation and table management",
    topic: "Restaurants",
    readTime: "8 min",
    summary: "Covers, waitlists, and guest preferences without double-booking.",
  },
  {
    title: "Menu engineering basics",
    topic: "Restaurants",
    readTime: "9 min",
    summary: "Costing, modifiers, and margin visibility tied to live sales.",
  },
  {
    title: "Kitchen display routing",
    topic: "Restaurants",
    readTime: "7 min",
    summary: "Prep stations, ticket pacing, and pass coordination.",
  },
  // POS
  {
    title: "Checkout and split payments",
    topic: "POS",
    readTime: "6 min",
    summary: "Receipts, tips, refunds, and payment methods in one flow.",
  },
  {
    title: "QR ordering for guests",
    topic: "POS",
    readTime: "8 min",
    summary: "Menus, cart, and kitchen sync without manual re-entry.",
  },
  {
    title: "End-of-day reconciliation",
    topic: "POS",
    readTime: "5 min",
    summary: "Close procedures when POS and finance share one ledger.",
  },
  // CRM
  {
    title: "Connect CRM to every cover",
    topic: "CRM",
    readTime: "7 min",
    summary: "Capture guests, rewards, and portal access without double entry.",
    slug: "crm-best-practices-service",
  },
  {
    title: "Loyalty program setup",
    topic: "CRM",
    readTime: "8 min",
    summary: "Points, tiers, and rewards tied to live visit data.",
    slug: "customer-loyalty-that-compounds",
  },
  {
    title: "Marketing segments from visits",
    topic: "CRM",
    readTime: "6 min",
    summary: "Build audiences from frequency, spend, and channel behaviour.",
  },
  // AI Agents
  {
    title: "Deploy AI Manager briefings",
    topic: "AI Agents",
    readTime: "6 min",
    summary: "Pre-service intelligence summaries for managers and floor leads.",
    slug: "ai-that-knows-your-service",
  },
  {
    title: "Configure AI Receptionist",
    topic: "AI Agents",
    readTime: "5 min",
    summary: "Booking queries, reminders, and guest FAQs automated safely.",
  },
  {
    title: "AI agent permissions",
    topic: "AI Agents",
    readTime: "4 min",
    summary: "Scope what each agent can read and recommend by role.",
  },
  // Automation
  {
    title: "Workflow triggers overview",
    topic: "Automation",
    readTime: "7 min",
    summary: "When to automate replenishment, campaigns, and alerts.",
    slug: "retail-automation-without-chaos",
  },
  {
    title: "Low-stock automation rules",
    topic: "Automation",
    readTime: "6 min",
    summary: "Thresholds, approvals, and supplier notifications.",
  },
  {
    title: "Guest win-back campaigns",
    topic: "Automation",
    readTime: "5 min",
    summary: "Automated outreach when visit frequency drops.",
  },
  // Integrations
  {
    title: "Connect accounting exports",
    topic: "Integrations",
    readTime: "9 min",
    summary: "Sync revenue, VAT, and ledger entries with your accounting stack.",
  },
  {
    title: "Stripe payments setup",
    topic: "Integrations",
    readTime: "6 min",
    summary: "Connect payment processing and reconcile settlements.",
  },
  {
    title: "API keys and webhooks",
    topic: "Integrations",
    readTime: "8 min",
    summary: "Authentication, events, and integration patterns for developers.",
  },
  // Payments
  {
    title: "Manage subscriptions",
    topic: "Payments",
    readTime: "5 min",
    summary: "Plans, invoices, billing contacts, and payment methods.",
  },
  {
    title: "Invoice and VAT settings",
    topic: "Payments",
    readTime: "6 min",
    summary: "Tax rules, invoice templates, and export formats.",
  },
  // Analytics
  {
    title: "Dashboard essentials",
    topic: "Analytics",
    readTime: "7 min",
    summary: "Revenue, labour, and inventory KPIs operators review daily.",
    slug: "analytics-that-drive-decisions",
  },
  {
    title: "Branch comparison reports",
    topic: "Analytics",
    readTime: "6 min",
    summary: "Consistent metrics across locations without spreadsheet exports.",
    slug: "business-intelligence-for-operators",
  },
  // Security
  {
    title: "Role-based access review",
    topic: "Security",
    readTime: "5 min",
    summary: "Quarterly permission audit checklist for administrators.",
    slug: "security-by-design-operators",
  },
  {
    title: "Enable MFA for admins",
    topic: "Security",
    readTime: "4 min",
    summary: "Protect billing, exports, and configuration with multi-factor auth.",
  },
  // Troubleshooting
  {
    title: "Prevent stockouts before service",
    topic: "Troubleshooting",
    readTime: "7 min",
    summary: "Purchase orders, low-stock alerts, and supplier continuity.",
    slug: "inventory-optimization-guide",
  },
  {
    title: "Kitchen ticket delays",
    topic: "Troubleshooting",
    readTime: "6 min",
    summary: "Diagnose routing, prep stations, and display sync issues.",
  },
  {
    title: "Sync and connectivity issues",
    topic: "Troubleshooting",
    readTime: "5 min",
    summary: "Recover gracefully when connectivity drops during service.",
  },
  {
    title: "Payment failure recovery",
    topic: "Troubleshooting",
    readTime: "4 min",
    summary: "Handle declined cards and partial captures without losing orders.",
  },
] as const;

export function getHelpGuideCountByTopic(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const guide of HELP_ALL_GUIDES) {
    counts[guide.topic] = (counts[guide.topic] ?? 0) + 1;
  }
  return counts;
}

export function getHelpSearchItems(): Array<HelpGuide & { category: string }> {
  return HELP_ALL_GUIDES.map((g) => ({ ...g, category: g.topic }));
}

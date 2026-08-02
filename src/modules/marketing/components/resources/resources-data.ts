export const RESOURCE_CATEGORIES = [
  "AI",
  "Operations",
  "Marketing",
  "CRM",
  "POS",
  "Inventory",
  "Finance",
  "Analytics",
  "Growth",
  "Security",
] as const;

export type ResourceCategory = (typeof RESOURCE_CATEGORIES)[number];

export const FEATURED_RESOURCES = [
  {
    id: "ai-business-guide",
    title: "AI Business Guide",
    category: "AI" as ResourceCategory,
    readTime: "18 min read",
    gradient: "linear-gradient(145deg, #3b82f6, #6366f1)",
    href: "/blog/ai-that-knows-your-service",
    cta: "Read guide",
  },
  {
    id: "restaurant-playbook",
    title: "Restaurant Growth Playbook",
    category: "Operations" as ResourceCategory,
    readTime: "22 min read",
    gradient: "linear-gradient(145deg, #f97316, #ef4444)",
    href: "/customer-success",
    cta: "Read playbook",
  },
  {
    id: "retail-ops",
    title: "Retail Operations Guide",
    category: "POS" as ResourceCategory,
    readTime: "16 min read",
    gradient: "linear-gradient(145deg, #8b5cf6, #a855f7)",
    href: "/industries",
    cta: "Read guide",
  },
  {
    id: "automation-handbook",
    title: "Business Automation Handbook",
    category: "Operations" as ResourceCategory,
    readTime: "20 min read",
    gradient: "linear-gradient(145deg, #06b6d4, #3b82f6)",
    href: "/features",
    cta: "Read handbook",
  },
  {
    id: "digital-toolkit",
    title: "Digital Transformation Toolkit",
    category: "Growth" as ResourceCategory,
    readTime: "25 min read",
    gradient: "linear-gradient(145deg, #10b981, #059669)",
    href: "/platform",
    cta: "Explore toolkit",
  },
  {
    id: "retention-strategies",
    title: "Customer Retention Strategies",
    category: "CRM" as ResourceCategory,
    readTime: "14 min read",
    gradient: "linear-gradient(145deg, #ec4899, #8b5cf6)",
    href: "/blog/operating-system-vs-tool-stack",
    cta: "Read strategies",
  },
] as const;

export const FREE_DOWNLOADS = [
  {
    title: "Business Checklists",
    desc: "Daily, weekly, and monthly operator checklists for service businesses.",
    format: "PDF · 12 pages",
    category: "Operations",
  },
  {
    title: "Implementation Templates",
    desc: "Discovery, configuration, and go-live templates for Busal OS rollout.",
    format: "PDF · 18 pages",
    category: "Operations",
  },
  {
    title: "Business KPIs",
    desc: "Essential metrics for restaurants, retail, and hospitality operators.",
    format: "PDF · 8 pages",
    category: "Analytics",
  },
  {
    title: "AI Readiness Assessment",
    desc: "Score your operation's readiness for AI agents and automation.",
    format: "PDF · 6 pages",
    category: "AI",
  },
  {
    title: "Restaurant Startup Guide",
    desc: "From concept to first service—systems, staffing, and tech stack.",
    format: "PDF · 24 pages",
    category: "Operations",
  },
  {
    title: "Operations Checklist",
    desc: "Pre-service, service, and close-out workflows for multi-branch teams.",
    format: "PDF · 10 pages",
    category: "Operations",
  },
] as const;

export const LEARNING_CENTER = [
  {
    type: "Articles",
    count: "24+",
    desc: "Operator insights on AI, automation, and modern business software.",
    href: "/blog",
  },
  {
    type: "Guides",
    count: "12+",
    desc: "Step-by-step playbooks for POS, CRM, inventory, and AI workflows.",
    href: "/help",
  },
  {
    type: "Case Studies",
    count: "8+",
    desc: "Real businesses, measured outcomes—revenue, time saved, efficiency.",
    href: "/customer-success",
  },
  {
    type: "Videos",
    count: "15+",
    desc: "Product walkthroughs, feature deep-dives, and operator tips.",
    href: "#featured-video",
  },
  {
    type: "Webinars",
    count: "6+",
    desc: "Live sessions with Busal specialists and industry operators.",
    href: "/book-demo",
  },
  {
    type: "Whitepapers",
    count: "4+",
    desc: "Enterprise architecture, security, and AI operating system strategy.",
    href: "/platform",
  },
] as const;

export const LATEST_INSIGHTS = [
  {
    slug: "operating-system-vs-tool-stack",
    title: "Why growing businesses outgrow tool stacks",
    excerpt:
      "When POS, CRM, and inventory disagree, operations pay the tax. An OS approach changes the economics.",
    author: "Busal Team",
    category: "Growth",
    readTime: "6 min",
    date: "Jun 12, 2026",
  },
  {
    slug: "ai-that-knows-your-service",
    title: "AI that understands service pressure",
    excerpt:
      "Generic copilots are polite. Domain agents that see kitchen queues and loyalty data are useful.",
    author: "Sarah Chen",
    category: "AI",
    readTime: "8 min",
    date: "May 28, 2026",
  },
  {
    slug: "implementation-that-sticks",
    title: "Implementation that sticks after go-live",
    excerpt:
      "Software launches fail in the first two weeks. Training and operating rhythms decide the outcome.",
    author: "James Okonkwo",
    category: "Operations",
    readTime: "7 min",
    date: "May 4, 2026",
  },
  {
    title: "Multi-location inventory without spreadsheet drift",
    excerpt: "How unified stock signals across branches reduce stockouts and emergency transfers.",
    author: "Amira Hassan",
    category: "Inventory",
    readTime: "5 min",
    date: "Apr 18, 2026",
    slug: "operating-system-vs-tool-stack",
  },
] as const;

export const FEATURED_VIDEO = {
  title: "Busal OS in 10 Minutes",
  desc: "See how one AI operating system replaces POS, CRM, kitchen, inventory, and analytics—with live operational intelligence.",
  duration: "10:24",
} as const;

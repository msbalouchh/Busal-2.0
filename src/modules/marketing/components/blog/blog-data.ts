import { BLOG_POSTS } from "@/modules/marketing/content/site-copy";
import type { CoverArtVariant } from "@/modules/marketing/components/marketing-cover-art";

export const BLOG_CATEGORIES = [
  "AI",
  "Restaurants",
  "Retail",
  "Automation",
  "Marketing",
  "Operations",
  "CRM",
  "Analytics",
  "Security",
  "Product Updates",
  "Growth",
] as const;

export type BlogCategory = (typeof BLOG_CATEGORIES)[number];

export type BlogArticle = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  dateLabel: string;
  category: BlogCategory;
  author: string;
  authorInitials: string;
  readTime: string;
  gradient: string;
  coverVariant: CoverArtVariant;
  tags: readonly string[];
  featured?: boolean;
  trending?: boolean;
  editorsPick?: boolean;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

type BlogSlug = (typeof BLOG_POSTS)[number]["slug"];

const ARTICLE_META: Record<
  BlogSlug,
  Omit<BlogArticle, "slug" | "title" | "excerpt" | "date" | "dateLabel">
> = {
  "operating-system-vs-tool-stack": {
    category: "Growth",
    author: "Sarah Chen",
    authorInitials: "SC",
    readTime: "6 min read",
    gradient: "linear-gradient(145deg, #3b82f6, #6366f1)",
    coverVariant: "growth",
    tags: ["Digital Transformation", "Operations", "Strategy"],
    featured: true,
    trending: true,
    editorsPick: true,
  },
  "ai-that-knows-your-service": {
    category: "AI",
    author: "James Okonkwo",
    authorInitials: "JO",
    readTime: "8 min read",
    gradient: "linear-gradient(145deg, #8b5cf6, #a855f7)",
    coverVariant: "ai",
    tags: ["AI Agents", "Operations", "Intelligence"],
    trending: true,
    editorsPick: true,
  },
  "implementation-that-sticks": {
    category: "Operations",
    author: "Amira Hassan",
    authorInitials: "AH",
    readTime: "7 min read",
    gradient: "linear-gradient(145deg, #06b6d4, #3b82f6)",
    coverVariant: "operations",
    tags: ["Onboarding", "Training", "Success"],
    trending: true,
  },
  "ai-for-restaurants": {
    category: "Restaurants",
    author: "Sarah Chen",
    authorInitials: "SC",
    readTime: "9 min read",
    gradient: "linear-gradient(145deg, #f97316, #ef4444)",
    coverVariant: "restaurant",
    tags: ["AI", "Restaurants", "Kitchen"],
    trending: true,
    editorsPick: true,
  },
  "retail-automation-without-chaos": {
    category: "Retail",
    author: "James Okonkwo",
    authorInitials: "JO",
    readTime: "8 min read",
    gradient: "linear-gradient(145deg, #10b981, #059669)",
    coverVariant: "retail",
    tags: ["Retail", "Automation", "Inventory"],
    trending: true,
  },
  "business-intelligence-for-operators": {
    category: "Analytics",
    author: "Priya Nair",
    authorInitials: "PN",
    readTime: "7 min read",
    gradient: "linear-gradient(145deg, #06b6d4, #0891b2)",
    coverVariant: "analytics",
    tags: ["Analytics", "BI", "Dashboards"],
    editorsPick: true,
  },
  "inventory-optimization-guide": {
    category: "Operations",
    author: "Amira Hassan",
    authorInitials: "AH",
    readTime: "10 min read",
    gradient: "linear-gradient(145deg, #6366f1, #8b5cf6)",
    coverVariant: "inventory",
    tags: ["Inventory", "Supply Chain", "Restaurants"],
    trending: true,
  },
  "crm-best-practices-service": {
    category: "CRM",
    author: "Sofia Mendes",
    authorInitials: "SM",
    readTime: "8 min read",
    gradient: "linear-gradient(145deg, #ec4899, #8b5cf6)",
    coverVariant: "crm",
    tags: ["CRM", "Loyalty", "Guest Experience"],
    editorsPick: true,
  },
  "staff-management-modern-ops": {
    category: "Operations",
    author: "Marcus Webb",
    authorInitials: "MW",
    readTime: "7 min read",
    gradient: "linear-gradient(145deg, #f59e0b, #f97316)",
    coverVariant: "staff",
    tags: ["HR", "Permissions", "Multi-location"],
  },
  "analytics-that-drive-decisions": {
    category: "Analytics",
    author: "Priya Nair",
    authorInitials: "PN",
    readTime: "6 min read",
    gradient: "linear-gradient(145deg, #3b82f6, #06b6d4)",
    coverVariant: "analytics",
    tags: ["Analytics", "KPIs", "Reporting"],
    trending: true,
  },
  "customer-loyalty-that-compounds": {
    category: "Marketing",
    author: "Sofia Mendes",
    authorInitials: "SM",
    readTime: "7 min read",
    gradient: "linear-gradient(145deg, #a855f7, #ec4899)",
    coverVariant: "loyalty",
    tags: ["Loyalty", "CRM", "Retention"],
    editorsPick: true,
  },
  "security-by-design-operators": {
    category: "Security",
    author: "Daniel Okoro",
    authorInitials: "DO",
    readTime: "9 min read",
    gradient: "linear-gradient(145deg, #1e293b, #334155)",
    coverVariant: "security",
    tags: ["Security", "Compliance", "Enterprise"],
    trending: true,
  },
  "busal-platform-summer-2026": {
    category: "Product Updates",
    author: "Busal Product Team",
    authorInitials: "BP",
    readTime: "5 min read",
    gradient: "linear-gradient(145deg, #6366f1, #3b82f6)",
    coverVariant: "product",
    tags: ["Product Updates", "AI", "Platform"],
    featured: false,
    trending: true,
  },
};

export const BLOG_ARTICLES: BlogArticle[] = BLOG_POSTS.map((post) => ({
  slug: post.slug,
  title: post.title,
  excerpt: post.excerpt,
  date: post.date,
  dateLabel: formatDate(post.date),
  ...ARTICLE_META[post.slug],
}));

export const FEATURED_STORY: BlogArticle =
  BLOG_ARTICLES.find((a) => a.featured) ?? BLOG_ARTICLES[0]!;

export const TRENDING_ARTICLES = BLOG_ARTICLES.filter((a) => a.trending);

export const EDITORS_PICKS = BLOG_ARTICLES.filter((a) => a.editorsPick);

export const PRODUCT_UPDATES = [
  {
    type: "New Features",
    title: "AI Manager briefings",
    desc: "Pre-service intelligence summaries for managers—covers, queues, and margin signals.",
    date: "Aug 2026",
    href: "/blog/busal-platform-summer-2026",
  },
  {
    type: "Releases",
    title: "Multi-location dashboard",
    desc: "Unified commercial view across branches with drill-down by location and module.",
    date: "Jul 2026",
    href: "/blog/busal-platform-summer-2026",
  },
  {
    type: "Roadmap",
    title: "Voice AI copilot",
    desc: "Hands-free operational briefings and floor assistance during service peaks.",
    date: "Q4 2026",
    href: "/blog/ai-that-knows-your-service",
  },
  {
    type: "AI Improvements",
    title: "Predictive inventory",
    desc: "Replenishment signals trained on sell-through, seasonality, and supplier lead times.",
    date: "Jun 2026",
    href: "/blog/inventory-optimization-guide",
  },
  {
    type: "New Features",
    title: "Customer portal refresh",
    desc: "Redesigned loyalty, reservations, and order history for end customers.",
    date: "May 2026",
    href: "/blog/customer-loyalty-that-compounds",
  },
] as const;

import { BLOG_POSTS } from "@/modules/marketing/content/site-copy";

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
  readTime: string;
  gradient: string;
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

const ARTICLE_META: Record<
  (typeof BLOG_POSTS)[number]["slug"],
  Omit<BlogArticle, "slug" | "title" | "excerpt" | "date" | "dateLabel">
> = {
  "operating-system-vs-tool-stack": {
    category: "Growth",
    author: "Sarah Chen",
    readTime: "6 min read",
    gradient: "linear-gradient(145deg, #3b82f6, #6366f1)",
    featured: true,
    trending: true,
    editorsPick: true,
  },
  "ai-that-knows-your-service": {
    category: "AI",
    author: "James Okonkwo",
    readTime: "8 min read",
    gradient: "linear-gradient(145deg, #8b5cf6, #a855f7)",
    trending: true,
    editorsPick: true,
  },
  "implementation-that-sticks": {
    category: "Operations",
    author: "Amira Hassan",
    readTime: "7 min read",
    gradient: "linear-gradient(145deg, #06b6d4, #3b82f6)",
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
  },
  {
    type: "Releases",
    title: "Multi-location dashboard",
    desc: "Unified commercial view across branches with drill-down by location and module.",
    date: "Jul 2026",
  },
  {
    type: "Roadmap",
    title: "Voice AI copilot",
    desc: "Hands-free operational briefings and floor assistance during service peaks.",
    date: "Q4 2026",
  },
  {
    type: "AI Improvements",
    title: "Predictive inventory",
    desc: "Replenishment signals trained on sell-through, seasonality, and supplier lead times.",
    date: "Jun 2026",
  },
  {
    type: "New Features",
    title: "Customer portal refresh",
    desc: "Redesigned loyalty, reservations, and order history for end customers.",
    date: "May 2026",
  },
] as const;

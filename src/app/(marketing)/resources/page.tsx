import Link from "next/link";

import { MarketingCtaBand } from "@/modules/marketing/components/marketing-cta";
import { PageHero } from "@/modules/marketing/components/page-primitives";
import {
  MarketingEyebrow,
  MarketingHeading,
  MarketingLead,
  MarketingSection,
} from "@/modules/marketing/components/marketing-typography";
import { MARKETING_ROUTES } from "@/modules/marketing/constants/routes";
import { BLOG_POSTS, FAQ_ITEMS, HELP_TOPICS } from "@/modules/marketing/content/site-copy";
import { marketingMetadata } from "@/modules/marketing/lib/seo";

export const metadata = marketingMetadata({
  title: "Resources",
  description:
    "Busal OS resources: blog, help center, and FAQ—guides for operators exploring the AI operating system.",
  path: MARKETING_ROUTES.resources,
});

const RESOURCE_HUB = [
  {
    title: "Blog",
    description:
      "Insights on operating systems, AI for service businesses, and implementation that sticks.",
    href: MARKETING_ROUTES.blog,
    count: `${BLOG_POSTS.length} articles`,
  },
  {
    title: "Help Center",
    description:
      "Getting started, orders, customers, inventory, AI, and billing—organized by topic.",
    href: MARKETING_ROUTES.help,
    count: `${HELP_TOPICS.length} topics`,
  },
  {
    title: "FAQ",
    description:
      "Common questions about implementation, pricing, AI, and how Busal replaces fragmented tools.",
    href: MARKETING_ROUTES.faq,
    count: `${FAQ_ITEMS.length} answers`,
  },
] as const;

export default function ResourcesPage() {
  return (
    <>
      <PageHero
        eyebrow="Resources"
        title="Guides, answers, and insights for operators."
        description="Whether you're evaluating Busal or already live, find practical resources on the platform, AI, and running a modern service business."
        primaryHref={MARKETING_ROUTES.help}
        primaryLabel="Browse help center"
        secondaryHref={MARKETING_ROUTES.contact}
        secondaryLabel="Contact support"
        breadcrumbs={[{ name: "Resources", path: MARKETING_ROUTES.resources }]}
      />

      <MarketingSection className="pt-0">
        <div className="grid gap-6 sm:grid-cols-3">
          {RESOURCE_HUB.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="border-marketing-line bg-marketing-panel group hover:border-marketing-ink/20 flex flex-col rounded-3xl border px-6 py-8 transition"
            >
              <MarketingEyebrow>{item.count}</MarketingEyebrow>
              <h3 className="font-marketing-display text-marketing-ink text-2xl tracking-tight group-hover:underline">
                {item.title}
              </h3>
              <p className="text-marketing-muted mt-3 flex-1 text-sm leading-relaxed">
                {item.description}
              </p>
              <span className="text-marketing-accent mt-6 text-sm font-semibold">Explore →</span>
            </Link>
          ))}
        </div>
      </MarketingSection>

      <MarketingSection>
        <MarketingEyebrow>Latest from the blog</MarketingEyebrow>
        <MarketingHeading>Recent articles</MarketingHeading>
        <ul className="mt-8 space-y-5">
          {BLOG_POSTS.slice(0, 2).map((post) => (
            <li key={post.slug} className="border-marketing-line border-t pt-5">
              <Link href={`${MARKETING_ROUTES.blog}/${post.slug}`} className="group block">
                <p className="text-marketing-muted text-xs">{post.date}</p>
                <h3 className="text-marketing-ink mt-1 font-semibold group-hover:underline">
                  {post.title}
                </h3>
                <p className="text-marketing-muted mt-2 text-sm">{post.excerpt}</p>
              </Link>
            </li>
          ))}
        </ul>
        <Link
          href={MARKETING_ROUTES.blog}
          className="text-marketing-accent mt-6 inline-block text-sm font-semibold"
        >
          View all articles →
        </Link>
      </MarketingSection>

      <MarketingSection>
        <MarketingEyebrow>Quick answers</MarketingEyebrow>
        <MarketingHeading>Popular FAQ</MarketingHeading>
        <MarketingLead>Start here if you&apos;re evaluating Busal for your business.</MarketingLead>
        <div className="mt-8 space-y-5">
          {FAQ_ITEMS.slice(0, 3).map((item) => (
            <div key={item.q} className="border-marketing-line border-t pt-5">
              <h3 className="font-semibold">{item.q}</h3>
              <p className="text-marketing-muted mt-2 text-sm leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
        <Link
          href={MARKETING_ROUTES.faq}
          className="text-marketing-accent mt-6 inline-block text-sm font-semibold"
        >
          Read full FAQ →
        </Link>
      </MarketingSection>

      <MarketingSection className="pb-24">
        <MarketingCtaBand
          title="Still have questions?"
          description="Book a demo for a tailored walkthrough—or contact our team for sales and support."
        />
      </MarketingSection>
    </>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";

import { MarketingBreadcrumbs } from "@/modules/marketing/components/marketing-breadcrumbs";
import { MarketingCtaBand } from "@/modules/marketing/components/marketing-cta";
import { ContentBlock } from "@/modules/marketing/components/page-primitives";
import {
  MarketingEyebrow,
  MarketingHeading,
  MarketingSection,
} from "@/modules/marketing/components/marketing-typography";
import { MARKETING_ROUTES } from "@/modules/marketing/constants/routes";
import { BLOG_POSTS } from "@/modules/marketing/content/site-copy";
import { marketingMetadata } from "@/modules/marketing/lib/seo";

const ARTICLE_BODY: Record<
  (typeof BLOG_POSTS)[number]["slug"],
  Array<{ heading?: string; paragraphs: string[] }>
> = {
  "operating-system-vs-tool-stack": [
    {
      paragraphs: [
        "Most growing businesses start with best-of-breed tools: a POS here, a CRM there, inventory in a spreadsheet, and finance in yet another system. Each vendor optimizes its slice. Nobody owns the whole operation.",
        "The hidden cost is reconciliation. When guest counts in the CRM don't match covers in the POS, or inventory counts drift from what the kitchen actually used, teams spend hours fixing data instead of serving guests.",
      ],
    },
    {
      heading: "The operating system approach",
      paragraphs: [
        "An operating system model puts orders, customers, inventory, and finance on one data foundation. Changes propagate instantly—a loyalty redemption updates the guest profile, the order total, and the revenue report without manual exports.",
        "That isn't just convenience. It changes decision economics. Managers see one version of truth before service starts. AI briefings read live queues and revenue, not stale CSV uploads.",
      ],
    },
    {
      heading: "When to make the switch",
      paragraphs: [
        "The inflection point usually arrives with the second location or the first serious growth push. Tool stacks that worked for one branch become coordination overhead for two.",
        "Busal OS is built for that moment: start with core operations, expand modules and branches as the business matures—without re-implementing integrations every time.",
      ],
    },
  ],
  "ai-that-knows-your-service": [
    {
      paragraphs: [
        "Generic AI assistants are fluent and polite. They can draft an email or summarise a document. What they cannot do is tell you that table twelve's order is stalling the kitchen pass, or that your Tuesday lunch segment is down fourteen percent against last month.",
        "Service businesses need domain intelligence—AI that reads operational context, not just language.",
      ],
    },
    {
      heading: "Domain agents vs generic copilots",
      paragraphs: [
        "Busal's AI agents connect to live POS, kitchen, CRM, and inventory data. An operations agent sees queue depth and prep times. A finance agent sees invoice patterns and cashflow signals. A marketing agent sees segment performance grounded in actual visit history.",
        "Recommendations are scoped by your permission model—the same roles and branches that govern staff access govern what AI can see and suggest.",
      ],
    },
    {
      heading: "Briefings that matter before the rush",
      paragraphs: [
        "The highest-value AI moments happen before service pressure peaks: a morning briefing that flags low stock on a bestseller, a pipeline nudge for a corporate booking, or a staffing note tied to reservation volume.",
        "That is the difference between AI as novelty and AI as operating rhythm.",
      ],
    },
  ],
  "implementation-that-sticks": [
    {
      paragraphs: [
        "Software launches fail in the first two weeks—not because the product is wrong, but because teams revert to old habits when the new system feels unfamiliar under pressure.",
        "Implementation quality is measured by what happens after go-live, not the day credentials are sent.",
      ],
    },
    {
      heading: "Structure beats speed",
      paragraphs: [
        "Busal engagements follow a defined path: discovery, business analysis, configuration, training, go-live, and ongoing success. Each stage has clear owners and outcomes.",
        "Discovery maps branches, roles, menus, and priorities. Configuration aligns the platform to real workflows—not generic templates. Training focuses on the rhythms managers and floor staff will repeat daily.",
      ],
    },
    {
      heading: "Partnership, not a handoff",
      paragraphs: [
        "Go-live is supported, not abandoned. Customer success stays engaged as teams optimise with analytics and AI. The goal is operational clarity that compounds—not a login and a PDF.",
        "Businesses that invest in the first thirty days of operating rhythm see the strongest long-term adoption. That is why implementation is a structured engagement, not an afterthought.",
      ],
    },
  ],
};

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const post = BLOG_POSTS.find((item) => item.slug === slug);
  if (!post) return {};

  return marketingMetadata({
    title: post.title,
    description: post.excerpt,
    path: `${MARKETING_ROUTES.blog}/${post.slug}`,
  });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function BlogArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const post = BLOG_POSTS.find((item) => item.slug === slug);
  if (!post) notFound();

  const sections = ARTICLE_BODY[post.slug];

  return (
    <>
      <MarketingBreadcrumbs
        items={[
          { name: "Blog", path: MARKETING_ROUTES.blog },
          { name: post.title, path: `${MARKETING_ROUTES.blog}/${post.slug}` },
        ]}
      />
      <MarketingSection className="pt-8 pb-10 sm:pt-12">
        <Link href={MARKETING_ROUTES.blog} className="text-marketing-accent text-sm font-semibold">
          ← Back to blog
        </Link>
        <p className="mt-6">
          <MarketingEyebrow>Article</MarketingEyebrow>
        </p>
        <MarketingHeading as="h1" className="mt-3 max-w-3xl">
          {post.title}
        </MarketingHeading>
        <time className="text-marketing-muted mt-4 block text-sm" dateTime={post.date}>
          {formatDate(post.date)}
        </time>
        <p className="text-marketing-muted mt-4 max-w-2xl text-base leading-relaxed">
          {post.excerpt}
        </p>
      </MarketingSection>

      <MarketingSection className="pt-0">
        <ContentBlock>
          {sections.map((section) => (
            <div key={section.heading ?? section.paragraphs[0]} className="space-y-4">
              {section.heading ? (
                <h2 className="font-marketing-display text-marketing-ink text-xl tracking-tight sm:text-2xl">
                  {section.heading}
                </h2>
              ) : null}
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 40)} className="text-marketing-muted">
                  {paragraph}
                </p>
              ))}
            </div>
          ))}
        </ContentBlock>
      </MarketingSection>

      <MarketingSection className="pb-24">
        <MarketingCtaBand
          title="Ready to unify your operation?"
          description="Book a demo to see how Busal OS replaces fragmented tools with one AI-first platform."
        />
      </MarketingSection>
    </>
  );
}

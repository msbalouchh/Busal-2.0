import Link from "next/link";
import { notFound } from "next/navigation";

import { BLOG_ARTICLE_BODIES } from "@/modules/marketing/components/blog/blog-article-bodies";
import { BLOG_ARTICLES } from "@/modules/marketing/components/blog/blog-data";
import { MarketingCoverArt } from "@/modules/marketing/components/marketing-cover-art";
import { MarketingCtaBand } from "@/modules/marketing/components/marketing-cta";
import { MarketingBreadcrumbs } from "@/modules/marketing/components/marketing-breadcrumbs";
import { ContentBlock } from "@/modules/marketing/components/page-primitives";
import {
  MarketingEyebrow,
  MarketingHeading,
  MarketingSection,
} from "@/modules/marketing/components/marketing-typography";
import { MARKETING_ROUTES } from "@/modules/marketing/constants/routes";
import { BLOG_POSTS } from "@/modules/marketing/content/site-copy";
import { marketingMetadata } from "@/modules/marketing/lib/seo";

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

export default async function BlogArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const post = BLOG_POSTS.find((item) => item.slug === slug);
  if (!post) notFound();

  const meta = BLOG_ARTICLES.find((a) => a.slug === slug);
  const sections = BLOG_ARTICLE_BODIES[slug as keyof typeof BLOG_ARTICLE_BODIES];

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
        {meta ? (
          <div className="mt-6 max-w-3xl overflow-hidden rounded-2xl">
            <MarketingCoverArt
              variant={meta.coverVariant}
              gradient={meta.gradient}
              label={meta.category}
              size="lg"
            />
          </div>
        ) : null}
        <p className="mt-6">
          <MarketingEyebrow>{meta?.category ?? "Article"}</MarketingEyebrow>
        </p>
        <MarketingHeading as="h1" className="mt-3 max-w-3xl">
          {post.title}
        </MarketingHeading>
        <div className="text-marketing-muted mt-4 flex flex-wrap items-center gap-3 text-sm">
          {meta ? (
            <>
              <span>{meta.author}</span>
              <span aria-hidden="true">·</span>
              <span>{meta.readTime}</span>
              <span aria-hidden="true">·</span>
            </>
          ) : null}
          <time dateTime={post.date}>
            {new Date(post.date).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </time>
        </div>
        {meta?.tags ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {meta.tags.map((tag) => (
              <span
                key={tag}
                className="border-marketing-line bg-marketing-panel text-marketing-muted rounded-full border px-2.5 py-0.5 text-xs font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}
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

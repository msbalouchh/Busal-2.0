import Link from "next/link";

import { MarketingCtaBand } from "@/modules/marketing/components/marketing-cta";
import { PageHero } from "@/modules/marketing/components/page-primitives";
import { MarketingSection } from "@/modules/marketing/components/marketing-typography";
import { MARKETING_ROUTES } from "@/modules/marketing/constants/routes";
import { BLOG_POSTS } from "@/modules/marketing/content/site-copy";
import { marketingMetadata } from "@/modules/marketing/lib/seo";

export const metadata = marketingMetadata({
  title: "Blog",
  description:
    "Busal OS blog: insights on operating systems, AI for service businesses, and implementation that delivers lasting results.",
  path: MARKETING_ROUTES.blog,
});

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function BlogPage() {
  return (
    <>
      <PageHero
        eyebrow="Blog"
        title="Ideas for operators who refuse fragmented tools."
        description="Perspectives on unified platforms, domain AI, and the implementation rhythms that decide whether software sticks."
        primaryHref={MARKETING_ROUTES.bookDemo}
        secondaryHref={MARKETING_ROUTES.resources}
        secondaryLabel="All resources"
        breadcrumbs={[{ name: "Blog", path: MARKETING_ROUTES.blog }]}
      />

      <MarketingSection className="pt-0 pb-24">
        <ul className="space-y-8">
          {BLOG_POSTS.map((post) => (
            <li key={post.slug}>
              <article className="border-marketing-line border-t pt-8">
                <time className="text-marketing-muted text-xs" dateTime={post.date}>
                  {formatDate(post.date)}
                </time>
                <h2 className="font-marketing-display text-marketing-ink mt-2 text-2xl tracking-tight sm:text-3xl">
                  <Link href={`${MARKETING_ROUTES.blog}/${post.slug}`} className="hover:underline">
                    {post.title}
                  </Link>
                </h2>
                <p className="text-marketing-muted mt-3 max-w-2xl text-sm leading-relaxed sm:text-base">
                  {post.excerpt}
                </p>
                <Link
                  href={`${MARKETING_ROUTES.blog}/${post.slug}`}
                  className="text-marketing-accent mt-4 inline-block text-sm font-semibold"
                >
                  Read article →
                </Link>
              </article>
            </li>
          ))}
        </ul>

        <div className="mt-16">
          <MarketingCtaBand
            title="See Busal OS in action."
            description="Book a demo to walk through the platform behind these ideas."
          />
        </div>
      </MarketingSection>
    </>
  );
}

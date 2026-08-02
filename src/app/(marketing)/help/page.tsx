import Link from "next/link";

import { MarketingCtaBand } from "@/modules/marketing/components/marketing-cta";
import { PageHero } from "@/modules/marketing/components/page-primitives";
import {
  MarketingHeading,
  MarketingLead,
  MarketingSection,
} from "@/modules/marketing/components/marketing-typography";
import { MARKETING_ROUTES } from "@/modules/marketing/constants/routes";
import { HELP_ARTICLES, HELP_TOPICS } from "@/modules/marketing/content/site-copy";
import { marketingMetadata } from "@/modules/marketing/lib/seo";

export const metadata = marketingMetadata({
  title: "Help Center",
  description:
    "Busal OS help center: guides for getting started, orders, customers, inventory, AI, and billing.",
  path: MARKETING_ROUTES.help,
});

export default function HelpPage() {
  return (
    <>
      <PageHero
        eyebrow="Help Center"
        title="Answers organized by how you work."
        description="Browse topics for onboarding, daily operations, and platform administration. For account-specific issues, contact support."
        primaryHref={MARKETING_ROUTES.contact}
        primaryLabel="Contact support"
        secondaryHref={MARKETING_ROUTES.faq}
        secondaryLabel="View FAQ"
        breadcrumbs={[{ name: "Help Center", path: MARKETING_ROUTES.help }]}
      />

      <MarketingSection className="pt-0">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {HELP_TOPICS.map((topic) => (
            <article
              key={topic.title}
              className="border-marketing-line bg-marketing-panel rounded-3xl border px-6 py-8"
            >
              <h2 className="text-marketing-ink text-base font-semibold">{topic.title}</h2>
              <p className="text-marketing-muted mt-2 text-sm leading-relaxed">{topic.summary}</p>
            </article>
          ))}
        </div>
      </MarketingSection>

      <MarketingSection>
        <MarketingHeading>Popular guides</MarketingHeading>
        <MarketingLead>
          Start with these operator-ready articles. Need something specific? Email{" "}
          <a href="mailto:support@getbusal.com" className="text-marketing-accent font-medium">
            support@getbusal.com
          </a>
          .
        </MarketingLead>
        <div className="mt-10 space-y-0">
          {HELP_ARTICLES.map((article) => (
            <article
              key={article.title}
              className="border-marketing-line grid gap-2 border-t py-5 sm:grid-cols-[10rem_1fr]"
            >
              <p className="text-marketing-muted text-xs font-semibold tracking-wide uppercase">
                {article.topic}
              </p>
              <div>
                <h3 className="text-marketing-ink text-base font-semibold">{article.title}</h3>
                <p className="text-marketing-muted mt-1 text-sm leading-relaxed">
                  {article.summary}
                </p>
              </div>
            </article>
          ))}
        </div>
      </MarketingSection>

      <MarketingSection>
        <MarketingHeading>Need more help?</MarketingHeading>
        <MarketingLead>
          Existing customers can reach support at{" "}
          <a href="mailto:support@getbusal.com" className="text-marketing-accent font-medium">
            support@getbusal.com
          </a>
          . Evaluating Busal?{" "}
          <Link href={MARKETING_ROUTES.bookDemo} className="text-marketing-accent font-medium">
            Book a demo
          </Link>{" "}
          or browse the{" "}
          <Link href={MARKETING_ROUTES.faq} className="text-marketing-accent font-medium">
            FAQ
          </Link>
          .
        </MarketingLead>
      </MarketingSection>

      <MarketingSection className="pb-24">
        <MarketingCtaBand
          title="New to Busal OS?"
          description="Book a demo for a guided walkthrough of the modules that matter to your operation."
        />
      </MarketingSection>
    </>
  );
}

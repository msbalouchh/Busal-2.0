import { MarketingCtaBand } from "@/modules/marketing/components/marketing-cta";
import { PageHero } from "@/modules/marketing/components/page-primitives";
import {
  MarketingEyebrow,
  MarketingHeading,
  MarketingLead,
  MarketingSection,
} from "@/modules/marketing/components/marketing-typography";
import { MARKETING_ROUTES } from "@/modules/marketing/constants/routes";
import { CAREERS } from "@/modules/marketing/content/site-copy";
import { marketingMetadata } from "@/modules/marketing/lib/seo";

export const metadata = marketingMetadata({
  title: "Careers",
  description:
    "Careers at Busal OS: join the team building the AI operating system for modern service businesses. Remote roles across the UK.",
  path: MARKETING_ROUTES.careers,
});

export default function CareersPage() {
  return (
    <>
      <PageHero
        eyebrow="Careers"
        title="Help build the operating system operators deserve."
        description="We're a remote-first team solving hard problems at the intersection of service operations, AI, and multi-branch software. If that excites you, we'd like to hear from you."
        primaryHref="mailto:careers@getbusal.com"
        primaryLabel="Email careers@getbusal.com"
        secondaryHref={MARKETING_ROUTES.about}
        secondaryLabel="About Busal"
        breadcrumbs={[{ name: "Careers", path: MARKETING_ROUTES.careers }]}
      />

      <MarketingSection className="pt-0">
        <MarketingEyebrow>Open roles</MarketingEyebrow>
        <MarketingHeading>Current opportunities</MarketingHeading>
        <MarketingLead>
          Don&apos;t see a perfect fit? Send your CV to{" "}
          <a href="mailto:careers@getbusal.com" className="text-marketing-accent font-medium">
            careers@getbusal.com
          </a>{" "}
          —we&apos;re always interested in exceptional people.
        </MarketingLead>

        <ul className="mt-10 space-y-4">
          {CAREERS.map((role) => (
            <li key={role.title}>
              <article className="border-marketing-line bg-marketing-panel flex flex-col gap-4 rounded-3xl border px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-marketing-ink text-lg font-semibold">{role.title}</h3>
                  <p className="text-marketing-muted mt-2 text-sm leading-relaxed">
                    {role.summary}
                  </p>
                  <p className="text-marketing-muted mt-3 text-xs">
                    {role.location} · {role.type}
                  </p>
                </div>
                <a
                  href={`mailto:careers@getbusal.com?subject=Application: ${encodeURIComponent(role.title)}`}
                  className="border-marketing-line text-marketing-ink hover:bg-marketing-surface inline-flex shrink-0 items-center justify-center rounded-xl border px-5 py-2.5 text-sm font-semibold transition"
                >
                  Apply
                </a>
              </article>
            </li>
          ))}
        </ul>
      </MarketingSection>

      <MarketingSection>
        <MarketingHeading>How we hire</MarketingHeading>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {[
            {
              step: "01",
              title: "Intro conversation",
              summary: "A 30-minute call to learn about you and share how we work.",
            },
            {
              step: "02",
              title: "Skills conversation",
              summary:
                "Role-specific discussion with the team you'd join—practical, not performative.",
            },
            {
              step: "03",
              title: "Decision & offer",
              summary: "We move quickly and communicate clearly at every stage.",
            },
          ].map((item) => (
            <div key={item.step} className="border-marketing-line border-t pt-5">
              <span className="text-marketing-accent text-sm font-semibold">{item.step}</span>
              <h3 className="text-marketing-ink mt-2 font-semibold">{item.title}</h3>
              <p className="text-marketing-muted mt-2 text-sm">{item.summary}</p>
            </div>
          ))}
        </div>
      </MarketingSection>

      <MarketingSection className="pb-24">
        <MarketingCtaBand
          title="Want to see what we're building?"
          description="Book a demo of Busal OS—or read more on our about page."
        />
      </MarketingSection>
    </>
  );
}

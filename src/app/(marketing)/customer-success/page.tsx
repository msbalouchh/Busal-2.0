import { MarketingCtaBand } from "@/modules/marketing/components/marketing-cta";
import { PageHero } from "@/modules/marketing/components/page-primitives";
import { RoiCalculator } from "@/modules/marketing/components/roi-calculator";
import {
  MarketingEyebrow,
  MarketingHeading,
  MarketingLead,
  MarketingSection,
} from "@/modules/marketing/components/marketing-typography";
import { MARKETING_ROUTES } from "@/modules/marketing/constants/routes";
import { CASE_STUDIES, JOURNEY, TESTIMONIALS } from "@/modules/marketing/content/site-copy";
import { marketingMetadata } from "@/modules/marketing/lib/seo";

export const metadata = marketingMetadata({
  title: "Customer Success",
  description:
    "From discovery to go-live and beyond—Busal OS customer success guides your team through implementation, training, and continuous growth.",
  path: MARKETING_ROUTES.customerSuccess,
});

export default function CustomerSuccessPage() {
  return (
    <>
      <PageHero
        eyebrow="Customer Success"
        title="Partnership from day one—not a software handoff."
        description="Implementation, training, and ongoing success are built into how Busal works. Your team launches with confidence and keeps improving with AI and analytics."
        primaryHref={MARKETING_ROUTES.bookDemo}
        secondaryHref={MARKETING_ROUTES.contact}
        secondaryLabel="Talk to success"
        breadcrumbs={[{ name: "Customer Success", path: MARKETING_ROUTES.customerSuccess }]}
      />

      <MarketingSection className="pt-0">
        <MarketingEyebrow>Case studies</MarketingEyebrow>
        <MarketingHeading>Business transformation, measured.</MarketingHeading>
        <MarketingLead>
          Operators use Busal to collapse tool stacks, accelerate service, and give managers a
          single operating picture.
        </MarketingLead>
        <div className="mt-12 space-y-6">
          {CASE_STUDIES.map((study) => (
            <article
              key={study.company}
              className="border-marketing-line from-marketing-panel to-marketing-surface grid gap-6 rounded-[1.75rem] border bg-gradient-to-br px-6 py-8 sm:px-8 lg:grid-cols-[0.85fr_1.4fr]"
            >
              <div>
                <p className="text-marketing-accent text-xs font-semibold tracking-[0.16em] uppercase">
                  {study.industry}
                </p>
                <h3 className="font-marketing-display text-marketing-ink mt-2 text-2xl tracking-tight">
                  {study.company}
                </h3>
                <p className="font-marketing-display text-marketing-ink mt-6 text-5xl tracking-tight">
                  {study.metric}
                </p>
                <p className="text-marketing-muted mt-1 text-sm font-medium">{study.metricLabel}</p>
              </div>
              <div>
                <p className="text-marketing-ink text-base leading-relaxed">{study.summary}</p>
                <ul className="mt-6 flex flex-wrap gap-2">
                  {study.outcomes.map((outcome) => (
                    <li
                      key={outcome}
                      className="border-marketing-line bg-marketing-surface text-marketing-ink rounded-full border px-3 py-1.5 text-xs font-medium"
                    >
                      {outcome}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </MarketingSection>

      <MarketingSection>
        <RoiCalculator />
      </MarketingSection>

      <MarketingSection>
        <MarketingEyebrow>Transformation timeline</MarketingEyebrow>
        <MarketingHeading>Seven stages to operational clarity.</MarketingHeading>
        <MarketingLead>
          Every engagement follows a proven path—adapted to your branches, roles, and service model.
        </MarketingLead>
        <ol className="mt-12 space-y-0">
          {JOURNEY.map((stage) => (
            <li
              key={stage.step}
              className="border-marketing-line grid gap-4 border-t py-8 sm:grid-cols-[4rem_1fr]"
            >
              <span className="font-marketing-display text-marketing-accent text-3xl tracking-tight">
                {stage.step}
              </span>
              <div>
                <h3 className="text-marketing-ink text-lg font-semibold">{stage.title}</h3>
                <p className="text-marketing-muted mt-2 text-sm leading-relaxed">{stage.summary}</p>
              </div>
            </li>
          ))}
        </ol>
      </MarketingSection>

      <MarketingSection>
        <MarketingHeading>What customers say</MarketingHeading>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {TESTIMONIALS.map((item) => (
            <blockquote
              key={item.name}
              className="border-marketing-line bg-marketing-panel flex flex-col rounded-3xl border px-6 py-8"
            >
              <p className="text-marketing-ink flex-1 text-sm leading-relaxed">
                &ldquo;{item.quote}&rdquo;
              </p>
              <footer className="mt-6 border-t pt-4">
                <p className="text-marketing-ink text-sm font-semibold">{item.name}</p>
                <p className="text-marketing-muted text-xs">{item.role}</p>
              </footer>
            </blockquote>
          ))}
        </div>
      </MarketingSection>

      <MarketingSection className="pb-24">
        <MarketingCtaBand
          title="Ready to start your journey?"
          description="Book a demo and meet the team that will guide your implementation from discovery to go-live."
        />
      </MarketingSection>
    </>
  );
}

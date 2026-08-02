import {
  MarketingCtaBand,
  MarketingPrimaryCta,
} from "@/modules/marketing/components/marketing-cta";
import { PageHero } from "@/modules/marketing/components/page-primitives";
import {
  MarketingEyebrow,
  MarketingHeading,
  MarketingLead,
  MarketingSection,
} from "@/modules/marketing/components/marketing-typography";
import { MARKETING_ROUTES } from "@/modules/marketing/constants/routes";
import { FAQ_ITEMS, IMPLEMENTATION_TIMELINE, PRICING } from "@/modules/marketing/content/site-copy";
import { faqJsonLd, marketingMetadata } from "@/modules/marketing/lib/seo";

export const metadata = marketingMetadata({
  title: "Pricing",
  description:
    "Busal OS pricing: one-time implementation £3,000–£4,000 and monthly plans from £199. Starter, Growth, Professional, and Enterprise.",
  path: MARKETING_ROUTES.pricing,
});

const COMPARISON = [
  {
    feature: "Core operations modules",
    starter: true,
    growth: true,
    professional: true,
    enterprise: true,
  },
  { feature: "Multi-branch", starter: false, growth: true, professional: true, enterprise: true },
  {
    feature: "CRM & loyalty",
    starter: "Essential",
    growth: true,
    professional: true,
    enterprise: true,
  },
  {
    feature: "Marketing campaigns",
    starter: false,
    growth: true,
    professional: true,
    enterprise: true,
  },
  { feature: "AI assistant", starter: true, growth: true, professional: true, enterprise: true },
  {
    feature: "Full AI agent suite",
    starter: false,
    growth: false,
    professional: true,
    enterprise: true,
  },
  {
    feature: "Automation platform",
    starter: false,
    growth: false,
    professional: true,
    enterprise: true,
  },
  {
    feature: "Dedicated success",
    starter: false,
    growth: false,
    professional: "Onboarding",
    enterprise: true,
  },
  { feature: "Custom SLA", starter: false, growth: false, professional: false, enterprise: true },
] as const;

function Cell({ value }: { value: boolean | string }) {
  if (value === true) return <span className="text-marketing-accent font-semibold">Yes</span>;
  if (value === false) return <span className="text-marketing-muted">—</span>;
  return <span className="text-marketing-ink text-sm">{value}</span>;
}

export default function PricingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(FAQ_ITEMS.slice(0, 4))) }}
      />
      <PageHero
        eyebrow="Pricing"
        title="Commercial clarity from day one."
        description="A structured implementation engagement, then a monthly plan that scales with locations, AI depth, and enterprise controls."
        primaryHref={MARKETING_ROUTES.bookDemo}
        secondaryHref={MARKETING_ROUTES.contact}
        secondaryLabel="Contact sales"
        breadcrumbs={[{ name: "Pricing", path: MARKETING_ROUTES.pricing }]}
      />

      <MarketingSection className="pt-0">
        <div className="border-marketing-line from-marketing-panel to-marketing-surface relative overflow-hidden rounded-3xl border bg-gradient-to-br px-6 py-10 sm:px-10">
          <div className="bg-marketing-accent/10 pointer-events-none absolute -top-20 -right-16 h-56 w-56 rounded-full blur-3xl" />
          <MarketingEyebrow>Implementation</MarketingEyebrow>
          <MarketingHeading as="h3">{PRICING.implementation.title}</MarketingHeading>
          <p className="font-marketing-display text-marketing-ink mt-4 text-5xl tracking-tight">
            {PRICING.implementation.range}
          </p>
          <MarketingLead className="mt-3">{PRICING.implementation.summary}</MarketingLead>
        </div>
      </MarketingSection>

      <MarketingSection>
        <MarketingEyebrow>Monthly plans</MarketingEyebrow>
        <MarketingHeading>Choose the depth your operation needs.</MarketingHeading>
        <div className="mt-10 grid gap-5 lg:grid-cols-4">
          {PRICING.plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-[1.75rem] border px-5 py-7 transition hover:-translate-y-1 ${
                plan.featured
                  ? "border-marketing-ink bg-marketing-ink text-marketing-surface shadow-[0_30px_60px_-40px_rgba(12,18,34,0.7)] lg:scale-[1.02]"
                  : "border-marketing-line bg-marketing-surface"
              }`}
            >
              {plan.featured ? (
                <span className="bg-marketing-accent absolute -top-3 left-5 rounded-full px-3 py-1 text-[11px] font-semibold text-white">
                  Most popular
                </span>
              ) : null}
              <p className="text-sm font-semibold">{plan.name}</p>
              <p className="font-marketing-display mt-4 text-4xl tracking-tight">
                {plan.price}
                <span className="text-base opacity-70">{plan.period}</span>
              </p>
              <p
                className={`mt-3 text-sm leading-relaxed ${plan.featured ? "text-white/70" : "text-marketing-muted"}`}
              >
                {plan.summary}
              </p>
              <ul className="mt-6 flex-1 space-y-2.5 text-sm">
                {plan.highlights.map((item) => (
                  <li
                    key={item}
                    className={`flex gap-2 ${plan.featured ? "text-white/85" : "text-marketing-muted"}`}
                  >
                    <span
                      className="bg-marketing-accent mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                      aria-hidden
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <MarketingPrimaryCta
                  href={MARKETING_ROUTES.bookDemo}
                  className={
                    plan.featured
                      ? "bg-marketing-surface text-marketing-ink w-full hover:bg-white"
                      : "w-full"
                  }
                >
                  Book a demo
                </MarketingPrimaryCta>
              </div>
            </div>
          ))}
        </div>
      </MarketingSection>

      <MarketingSection>
        <MarketingHeading>Implementation timeline</MarketingHeading>
        <MarketingLead>
          Typical engagements run four weeks from discovery to go-live—adjusted for branch count and
          data complexity.
        </MarketingLead>
        <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {IMPLEMENTATION_TIMELINE.map((phase) => (
            <li
              key={phase.week}
              className="border-marketing-line bg-marketing-panel rounded-3xl border px-5 py-6"
            >
              <p className="text-marketing-accent text-xs font-semibold tracking-wide uppercase">
                {phase.week}
              </p>
              <h3 className="text-marketing-ink mt-2 text-base font-semibold">{phase.title}</h3>
              <p className="text-marketing-muted mt-2 text-sm leading-relaxed">{phase.summary}</p>
            </li>
          ))}
        </ol>
      </MarketingSection>

      <MarketingSection>
        <MarketingHeading>Feature comparison</MarketingHeading>
        <div className="border-marketing-line mt-8 overflow-x-auto rounded-2xl border">
          <table className="w-full min-w-[640px] text-left text-sm">
            <caption className="sr-only">Busal OS plan feature comparison</caption>
            <thead className="bg-marketing-panel text-marketing-ink">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Capability
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Starter
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Growth
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Professional
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Enterprise
                </th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((row) => (
                <tr key={row.feature} className="border-marketing-line border-t">
                  <th scope="row" className="text-marketing-ink px-4 py-3 text-left font-medium">
                    {row.feature}
                  </th>
                  <td className="px-4 py-3">
                    <Cell value={row.starter} />
                  </td>
                  <td className="px-4 py-3">
                    <Cell value={row.growth} />
                  </td>
                  <td className="px-4 py-3">
                    <Cell value={row.professional} />
                  </td>
                  <td className="px-4 py-3">
                    <Cell value={row.enterprise} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </MarketingSection>

      <MarketingSection>
        <MarketingHeading>Pricing FAQ</MarketingHeading>
        <div className="mt-8 space-y-5">
          {FAQ_ITEMS.slice(0, 4).map((item) => (
            <div key={item.q} className="border-marketing-line border-t pt-5">
              <h3 className="font-semibold">{item.q}</h3>
              <p className="text-marketing-muted mt-2 text-sm leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </MarketingSection>

      <MarketingSection className="pb-24">
        <MarketingCtaBand
          title="Choose a plan after we understand your operation."
          description="Book a demo for a tailored recommendation—Starter through Enterprise."
        />
      </MarketingSection>
    </>
  );
}

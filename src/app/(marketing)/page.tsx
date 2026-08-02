import Link from "next/link";

import { ROUTES } from "@/constants/routes";
import { AnimatedStat } from "@/modules/marketing/components/animated-stat";
import { LogoCloud } from "@/modules/marketing/components/logo-cloud";
import {
  MarketingCtaBand,
  MarketingPrimaryCta,
  MarketingSecondaryCta,
} from "@/modules/marketing/components/marketing-cta";
import { AiPreview, DashboardPreview } from "@/modules/marketing/components/product-previews";
import {
  MarketingEyebrow,
  MarketingHeading,
  MarketingLead,
  MarketingSection,
} from "@/modules/marketing/components/marketing-typography";
import { MARKETING_ROUTES } from "@/modules/marketing/constants/routes";
import {
  BRAND,
  INDUSTRIES,
  INTEGRATIONS,
  JOURNEY,
  MODULES,
  PRICING,
  SECURITY_POINTS,
  STATS,
  TESTIMONIALS,
} from "@/modules/marketing/content/site-copy";
import { marketingMetadata } from "@/modules/marketing/lib/seo";

export const metadata = marketingMetadata({
  title: `${BRAND.name} — ${BRAND.tagline}`,
  description: BRAND.description,
  path: "/",
});

export default function MarketingHomePage() {
  return (
    <>
      <section className="relative min-h-[min(92vh,920px)] overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_55%,rgba(247,245,241,0.95)_100%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_80%_10%,rgba(13,115,119,0.12),transparent_55%)]" />
        <div className="mx-auto grid max-w-6xl gap-10 px-4 pt-16 pb-12 sm:px-6 sm:pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-end lg:px-8 lg:pt-24">
          <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500">
            <p className="font-marketing-display text-marketing-ink text-5xl tracking-tight sm:text-6xl lg:text-7xl">
              {BRAND.name}
            </p>
            <h1 className="font-marketing-display text-marketing-ink mt-5 max-w-xl text-3xl leading-[1.1] tracking-tight sm:text-4xl">
              {BRAND.tagline}
            </h1>
            <p className="text-marketing-muted mt-5 max-w-lg text-base text-pretty sm:text-lg">
              One AI-first platform for orders, customers, inventory, finance, and
              intelligence—built for operators who refuse to run on fragmented tools.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <MarketingPrimaryCta href={MARKETING_ROUTES.bookDemo}>
                Book a demo
              </MarketingPrimaryCta>
              <MarketingSecondaryCta href={ROUTES.signup}>Get started</MarketingSecondaryCta>
            </div>
            <p className="text-marketing-muted mt-5 text-xs sm:text-sm">
              Implementation from {PRICING.implementation.range} · Plans from{" "}
              {PRICING.plans[0].price}
              {PRICING.plans[0].period}
            </p>
          </div>
          <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:duration-700">
            <DashboardPreview />
          </div>
        </div>
      </section>

      <LogoCloud />

      <MarketingSection className="pt-16">
        <MarketingEyebrow>AI Platform</MarketingEyebrow>
        <MarketingHeading>Intelligence that understands your service.</MarketingHeading>
        <MarketingLead>
          Domain agents read live operations—not generic chat—so teams get briefings they can act on
          before the rush.
        </MarketingLead>
        <div className="mt-10">
          <AiPreview />
        </div>
        <div className="mt-6">
          <Link
            href={MARKETING_ROUTES.ai}
            className="text-marketing-accent text-sm font-semibold underline-offset-4 hover:underline"
          >
            Explore the AI Platform →
          </Link>
        </div>
      </MarketingSection>

      <MarketingSection>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((stat) => (
            <AnimatedStat key={stat.label} value={stat.value} label={stat.label} hint={stat.hint} />
          ))}
        </div>
      </MarketingSection>

      <MarketingSection>
        <MarketingEyebrow>Platform</MarketingEyebrow>
        <MarketingHeading>Everything that runs the business—connected.</MarketingHeading>
        <MarketingLead>
          CRM, POS, kitchen, inventory, finance, and portals share one source of truth. No more
          export-import theatre.
        </MarketingLead>
        <div className="mt-10 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.slice(0, 9).map((module) => (
            <article
              key={module.name}
              className="border-marketing-line group hover:border-marketing-accent/40 border-t pt-4 transition-colors"
            >
              <h3 className="group-hover:text-marketing-accent text-base font-semibold transition-colors">
                {module.name}
              </h3>
              <p className="text-marketing-muted mt-2 text-sm leading-relaxed">{module.summary}</p>
            </article>
          ))}
        </div>
        <div className="mt-8">
          <Link
            href={MARKETING_ROUTES.features}
            className="text-marketing-accent text-sm font-semibold underline-offset-4 hover:underline"
          >
            See all modules →
          </Link>
        </div>
      </MarketingSection>

      <MarketingSection>
        <MarketingEyebrow>Industries</MarketingEyebrow>
        <MarketingHeading>
          Built deep for restaurants. Designed for every industry.
        </MarketingHeading>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {INDUSTRIES.slice(0, 6).map((industry) => (
            <div
              key={industry.name}
              className="bg-marketing-panel/70 border-marketing-line hover:border-marketing-accent/30 rounded-2xl border px-5 py-5 transition"
            >
              <h3 className="font-semibold">{industry.name}</h3>
              <p className="text-marketing-muted mt-2 text-sm">{industry.summary}</p>
            </div>
          ))}
        </div>
        <div className="mt-8">
          <Link
            href={MARKETING_ROUTES.industries}
            className="text-marketing-accent text-sm font-semibold underline-offset-4 hover:underline"
          >
            View all industries →
          </Link>
        </div>
      </MarketingSection>

      <MarketingSection>
        <MarketingEyebrow>Customer journey</MarketingEyebrow>
        <MarketingHeading>From first conversation to measurable growth.</MarketingHeading>
        <ol className="mt-10 space-y-0">
          {JOURNEY.map((item) => (
            <li
              key={item.step}
              className="border-marketing-line grid gap-2 border-t py-5 sm:grid-cols-[5rem_1fr] sm:gap-8"
            >
              <span className="text-marketing-accent font-marketing-display text-2xl">
                {item.step}
              </span>
              <div>
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-marketing-muted mt-1 text-sm">{item.summary}</p>
              </div>
            </li>
          ))}
        </ol>
      </MarketingSection>

      <MarketingSection>
        <MarketingEyebrow>Pricing</MarketingEyebrow>
        <MarketingHeading>Clear commercial structure.</MarketingHeading>
        <MarketingLead>
          One-time implementation {PRICING.implementation.range}. Monthly plans from{" "}
          {PRICING.plans[0].price}
          {PRICING.plans[0].period}.
        </MarketingLead>
        <div className="mt-10 grid gap-4 lg:grid-cols-4">
          {PRICING.plans.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-2xl border px-5 py-6 transition hover:-translate-y-0.5 ${
                plan.featured
                  ? "border-marketing-ink bg-marketing-ink text-marketing-surface shadow-lg"
                  : "border-marketing-line bg-marketing-surface"
              }`}
            >
              <p className="text-sm font-semibold">{plan.name}</p>
              <p className="font-marketing-display mt-3 text-3xl tracking-tight">
                {plan.price}
                <span className="text-base opacity-70">{plan.period}</span>
              </p>
              <p
                className={`mt-3 text-sm ${plan.featured ? "text-white/70" : "text-marketing-muted"}`}
              >
                {plan.summary}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-8">
          <Link
            href={MARKETING_ROUTES.pricing}
            className="text-marketing-accent text-sm font-semibold underline-offset-4 hover:underline"
          >
            Compare plans →
          </Link>
        </div>
      </MarketingSection>

      <MarketingSection>
        <MarketingEyebrow>Operators</MarketingEyebrow>
        <MarketingHeading>Trusted by teams who live the rush.</MarketingHeading>
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {TESTIMONIALS.map((item) => (
            <blockquote key={item.name} className="border-marketing-line border-t pt-5">
              <p className="text-marketing-ink text-base leading-relaxed">
                &ldquo;{item.quote}&rdquo;
              </p>
              <footer className="text-marketing-muted mt-4 text-sm">
                <span className="text-marketing-ink font-medium">{item.name}</span> · {item.role}
              </footer>
            </blockquote>
          ))}
        </div>
      </MarketingSection>

      <MarketingSection>
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <MarketingEyebrow>Integrations</MarketingEyebrow>
            <MarketingHeading as="h3">Connect the channels you already use.</MarketingHeading>
            <div className="mt-6 flex flex-wrap gap-2">
              {INTEGRATIONS.map((item) => (
                <span
                  key={item}
                  className="border-marketing-line bg-marketing-panel text-marketing-ink rounded-full border px-3 py-1.5 text-xs font-medium"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
          <div>
            <MarketingEyebrow>Security</MarketingEyebrow>
            <MarketingHeading as="h3">Enterprise discipline by default.</MarketingHeading>
            <div className="mt-6 space-y-4">
              {SECURITY_POINTS.map((point) => (
                <div key={point.title}>
                  <h4 className="text-sm font-semibold">{point.title}</h4>
                  <p className="text-marketing-muted mt-1 text-sm">{point.summary}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </MarketingSection>

      <MarketingSection className="pb-24">
        <MarketingCtaBand
          title="Ready to run your business on one operating system?"
          description="Book a demo with our team, or start onboarding and configure your first location."
        />
      </MarketingSection>
    </>
  );
}

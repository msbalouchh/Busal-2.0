"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  BarChart3,
  Bot,
  Briefcase,
  Building2,
  Calculator,
  CalendarCheck2,
  ChevronDown,
  Dumbbell,
  GraduationCap,
  Hotel,
  Megaphone,
  Scissors,
  ShoppingBag,
  Sparkles,
  Star,
  Stethoscope,
  Users,
  Utensils,
  Workflow,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";
import { HomeDashboard } from "@/modules/marketing/components/home/home-dashboard";
import { FadeIn, Reveal } from "@/modules/marketing/components/home/home-motion";
import { MARKETING_ROUTES } from "@/modules/marketing/constants/routes";
import {
  AI_AGENTS,
  BRAND,
  CUSTOMER_LOGOS,
  FAQ_ITEMS,
  PRICING,
  TESTIMONIALS,
} from "@/modules/marketing/content/site-copy";

const AI_CAPABILITIES = [
  {
    title: "Live operations intelligence",
    summary: "See orders, covers, and bottlenecks as they happen—then act before service slips.",
    icon: BarChart3,
  },
  {
    title: "Domain AI agents",
    summary: "Specialists for sales, support, finance, HR, and operations—not generic chat.",
    icon: Bot,
  },
  {
    title: "Customer memory",
    summary: "CRM context follows every booking, ticket, and campaign across the business.",
    icon: Sparkles,
  },
  {
    title: "Automated workflows",
    summary: "Trigger follow-ups, alerts, and approvals without duct-taping another tool.",
    icon: Workflow,
  },
  {
    title: "Predictive demand",
    summary: "Forecast rush windows, staffing pressure, and inventory risk from live signals.",
    icon: CalendarCheck2,
  },
  {
    title: "Enterprise controls",
    summary: "Roles, branches, audit trails, and governance built for multi-location growth.",
    icon: Building2,
  },
] as const;

const PLATFORM = [
  {
    title: "Operations",
    summary: "POS, kitchen, inventory, and reservations on one real-time spine.",
    icon: Utensils,
  },
  {
    title: "Marketing",
    summary: "Campaigns and segments grounded in actual guest behaviour.",
    icon: Megaphone,
  },
  {
    title: "CRM",
    summary: "Profiles, loyalty, and next-best actions without spreadsheet drift.",
    icon: Users,
  },
  {
    title: "Analytics",
    summary: "Executive clarity on revenue, product mix, and labour in minutes.",
    icon: BarChart3,
  },
  {
    title: "Automation",
    summary: "Rules and agents that remove repetitive manager busywork.",
    icon: Workflow,
  },
] as const;

const INDUSTRIES = [
  { name: "Restaurant", icon: Utensils, summary: "Menus, QR, kitchen, loyalty." },
  { name: "Retail", icon: ShoppingBag, summary: "Catalog, stock, retention." },
  { name: "Salon", icon: Scissors, summary: "Bookings and repeat visits." },
  { name: "Clinic", icon: Stethoscope, summary: "Appointments and front desk." },
  { name: "Gym", icon: Dumbbell, summary: "Memberships and schedules." },
  { name: "Hotel", icon: Hotel, summary: "Guest journeys coordinated." },
  { name: "Construction", icon: Building2, summary: "Projects and suppliers." },
  { name: "Education", icon: GraduationCap, summary: "Enrollment and ops." },
  { name: "Accounting", icon: Calculator, summary: "Clients, billing, delivery." },
  { name: "Services", icon: Briefcase, summary: "CRM, delivery, portals." },
] as const;

const FEATURES = [
  {
    title: "One command center for every location",
    summary:
      "Managers open a single view of revenue, queues, reservations, and staffing—without exporting three systems into a Friday spreadsheet.",
    points: ["Live branch switching", "Role-aware dashboards", "Exception alerts"],
  },
  {
    title: "AI that understands service pressure",
    summary:
      "Domain agents read kitchen tickets, loyalty tiers, and cashflow signals so morning briefings are decisions—not more reading.",
    points: ["Cross-module context", "Actionable recommendations", "Human approval paths"],
  },
  {
    title: "Built for teams who cannot afford downtime",
    summary:
      "From first seating to close, Busal keeps orders, guests, and finance aligned so the floor stays calm when demand spikes.",
    points: ["Offline-resilient flows", "Audit-ready history", "Fast onboarding"],
  },
] as const;

const PLANS = PRICING.plans.filter((plan) => ["starter", "growth", "enterprise"].includes(plan.id));

function FeaturePreview({ variant }: { variant: number }) {
  const heights = [
    [40, 65, 48, 80, 58, 90, 70],
    [55, 42, 72, 60, 88, 50, 76],
    [62, 70, 45, 84, 58, 92, 66],
  ][variant % 3]!;

  return (
    <div className="home-card relative overflow-hidden p-5 sm:p-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(59,130,246,0.22),transparent_45%)]" />
      <div className="relative space-y-3">
        <div className="flex gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[68, 52, 84].map((h) => (
            <div key={h} className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="h-2 w-10 rounded bg-white/15" />
              <div className="mt-3 h-8 rounded bg-gradient-to-r from-[#3B82F6]/50 to-[#8B5CF6]/40" />
              <div className="mt-2 rounded bg-white/10" style={{ height: `${h / 4}px` }} />
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
          <div className="mb-3 h-2 w-24 rounded bg-white/15" />
          <div className="flex h-16 items-end gap-1">
            {heights.map((h, i) => (
              <div
                key={i}
                className="min-w-0 flex-1 rounded-sm bg-gradient-to-t from-[#3B82F6]/30 to-[#8B5CF6]/80"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  const reduced = useReducedMotion();

  return (
    <div className="border-b border-white/10 last:border-b-0">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-4 py-5 text-left"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="text-base font-medium text-white sm:text-lg">{q}</span>
        <ChevronDown
          className={cn(
            "h-5 w-5 shrink-0 text-white/50 transition-transform duration-300",
            open && "rotate-180",
          )}
        />
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={reduced ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduced ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.28 }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-sm leading-relaxed text-white/60 sm:text-base">{a}</p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export function HomePage() {
  const logos = [...CUSTOMER_LOGOS, ...CUSTOMER_LOGOS];

  return (
    <div className="home">
      {/* Hero */}
      <section className="home-hero">
        <div className="home-hero__glow" />
        <div className="home-container">
          <div className="home-hero__grid">
            <div className="home-hero__copy">
              <FadeIn delay={0.04}>
                <span className="home-hero__badge">
                  <Sparkles className="h-3.5 w-3.5 text-[#8B5CF6]" aria-hidden="true" />
                  AI Operating System for Businesses
                </span>
              </FadeIn>

              <FadeIn delay={0.1}>
                <h1 className="home-hero__headline">
                  One platform.
                  <br />
                  Every operation.
                  <br />
                  <span className="home-hero__headline-accent">Powered by AI.</span>
                </h1>
              </FadeIn>

              <FadeIn delay={0.18}>
                <p className="home-hero__desc">
                  {BRAND.name} unifies orders, customers, inventory, finance, and intelligence into
                  one AI-first operating system—so growing businesses run with clarity, speed, and
                  control instead of fragmented tools.
                </p>
              </FadeIn>

              <FadeIn delay={0.26}>
                <div className="home-hero__actions">
                  <Link href={ROUTES.signup} className="home-btn home-btn--primary">
                    Start Free
                  </Link>
                  <Link href={MARKETING_ROUTES.bookDemo} className="home-btn home-btn--secondary">
                    Book Demo
                  </Link>
                </div>
              </FadeIn>

              <FadeIn delay={0.34}>
                <div className="home-hero__trust">
                  <p className="home-hero__trust-text">
                    Trusted by restaurants, retailers and service businesses.
                  </p>
                  <div className="flex items-center gap-2" aria-label="Rated 4.9 out of 5">
                    <div className="flex text-[#FBBF24]">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-current" aria-hidden="true" />
                      ))}
                    </div>
                    <span className="text-sm font-semibold text-white">4.9</span>
                  </div>
                  <div className="home-hero__metric">
                    <strong>500+</strong>
                    <span>operators onboarded</span>
                  </div>
                </div>
              </FadeIn>
            </div>

            <div className="home-hero__visual">
              <HomeDashboard />
            </div>
          </div>
        </div>
      </section>

      {/* Trusted by */}
      <section className="home-marquee" aria-label="Trusted companies">
        <p className="home-marquee__label">Trusted by operators across industries</p>
        <div className="home-marquee__viewport">
          <div className="home-marquee__track">
            {logos.map((name, i) => (
              <span key={`${name}-${i}`} className="home-marquee__item">
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* AI capabilities */}
      <section className="home-section">
        <div className="home-container">
          <Reveal>
            <p className="home-eyebrow">AI Capabilities</p>
            <h2 className="home-title">Intelligence designed for how businesses actually run.</h2>
            <p className="home-lead">
              Six capability layers that turn live operational data into decisions your team can
              trust under pressure.
            </p>
          </Reveal>
          <div className="home-cards-3">
            {AI_CAPABILITIES.map((item, i) => (
              <Reveal key={item.title} delay={i * 0.04}>
                <article className="home-card group h-full p-6 transition duration-300 hover:-translate-y-1 hover:border-[#3B82F6]/35">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#3B82F6]/25 to-[#8B5CF6]/25 text-[#93C5FD]">
                    <item.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-5 text-lg font-semibold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/55">{item.summary}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Platform overview */}
      <section className="home-section home-section--tight">
        <div className="home-container">
          <Reveal>
            <p className="home-eyebrow">Platform</p>
            <h2 className="home-title">Every critical function. One operating rhythm.</h2>
            <p className="home-lead">
              Replace tool sprawl with a connected system for operations, growth, and finance.
            </p>
          </Reveal>
          <div className="home-cards-5">
            {PLATFORM.map((item, i) => (
              <Reveal key={item.title} delay={i * 0.03}>
                <article className="home-card h-full p-5">
                  <item.icon className="h-5 w-5 text-[#3B82F6]" aria-hidden="true" />
                  <h3 className="mt-4 text-base font-semibold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/55">{item.summary}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Industries */}
      <section className="home-section">
        <div className="home-container">
          <Reveal>
            <p className="home-eyebrow">Industries</p>
            <h2 className="home-title">Depth for restaurants. Ready for every vertical.</h2>
            <p className="home-lead">
              Start where you operate today—then expand on the same multi-tenant foundation.
            </p>
          </Reveal>
          <div className="home-industries">
            {INDUSTRIES.map((industry, i) => (
              <Reveal key={industry.name} delay={i * 0.02}>
                <Link
                  href={MARKETING_ROUTES.industries}
                  className="home-card flex h-full flex-col p-4 transition hover:border-[#8B5CF6]/40 hover:bg-white/[0.07]"
                >
                  <industry.icon className="h-5 w-5 text-[#8B5CF6]" aria-hidden="true" />
                  <h3 className="mt-3 text-sm font-semibold text-white">{industry.name}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-white/50">{industry.summary}</p>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="home-section">
        <div className="home-container">
          <Reveal>
            <p className="home-eyebrow">Features</p>
            <h2 className="home-title">Product depth you can feel in the first week.</h2>
            <p className="home-lead">
              Alternating product moments that show how Busal looks in daily operations.
            </p>
          </Reveal>
          <div className="mt-12">
            {FEATURES.map((feature, index) => (
              <Reveal key={feature.title}>
                <div
                  className={cn("home-feature-row", index % 2 === 1 && "home-feature-row--reverse")}
                >
                  <div className="min-w-0">
                    <h3 className="font-marketing-display text-2xl tracking-tight text-white sm:text-3xl">
                      {feature.title}
                    </h3>
                    <p className="mt-4 max-w-xl text-base leading-relaxed text-white/60">
                      {feature.summary}
                    </p>
                    <ul className="mt-6 space-y-2.5">
                      {feature.points.map((point) => (
                        <li key={point} className="flex items-center gap-2.5 text-sm text-white/75">
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#3B82F6]" />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <FeaturePreview variant={index} />
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* AI Assistants */}
      <section className="home-section home-section--tight">
        <div className="home-container">
          <Reveal>
            <p className="home-eyebrow">AI Assistants</p>
            <h2 className="home-title">A specialist for every critical decision.</h2>
            <p className="home-lead">
              Domain agents that read your live business context—and recommend the next move.
            </p>
          </Reveal>
          <div className="home-cards-3">
            {AI_AGENTS.slice(0, 6).map((agent, i) => (
              <Reveal key={agent.name} delay={i * 0.04}>
                <article className="home-card relative h-full overflow-hidden p-6">
                  <div className="pointer-events-none absolute -top-10 -right-10 h-28 w-28 rounded-full bg-[#8B5CF6]/20 blur-2xl" />
                  <div className="relative">
                    <span className="inline-flex rounded-full border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 px-2.5 py-1 text-[11px] font-semibold text-[#C4B5FD]">
                      {agent.name}
                    </span>
                    <p className="mt-4 text-sm leading-relaxed text-white/60">{agent.summary}</p>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
          <div className="mt-8">
            <Link
              href={MARKETING_ROUTES.ai}
              className="text-sm font-semibold text-white/70 transition hover:text-white"
            >
              Explore the AI Platform →
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="home-section">
        <div className="home-container">
          <Reveal>
            <p className="home-eyebrow">Pricing</p>
            <h2 className="home-title">Clear plans for every stage of growth.</h2>
            <p className="home-lead">
              One-time implementation {PRICING.implementation.range}. Then choose the monthly plan
              that matches your ambition.
            </p>
          </Reveal>
          <div className="home-pricing">
            {PLANS.map((plan, i) => (
              <Reveal key={plan.id} delay={i * 0.05}>
                <article
                  className={cn(
                    "home-card relative flex h-full flex-col p-6 sm:p-8",
                    plan.featured &&
                      "border-[#3B82F6]/45 bg-gradient-to-b from-[#1e3a5f]/70 to-[rgba(11,16,32,0.9)] shadow-[0_24px_80px_-32px_rgba(59,130,246,0.65)]",
                  )}
                >
                  {plan.featured ? (
                    <span className="absolute top-5 right-5 rounded-full bg-[#3B82F6] px-2.5 py-0.5 text-[10px] font-semibold text-white">
                      Popular
                    </span>
                  ) : null}
                  <p className="text-sm font-semibold text-white/80">{plan.name}</p>
                  <p className="font-marketing-display mt-4 text-4xl tracking-tight text-white">
                    {plan.price}
                    <span className="text-base text-white/45">{plan.period}</span>
                  </p>
                  <p className="mt-3 text-sm text-white/55">{plan.summary}</p>
                  <ul className="mt-6 flex-1 space-y-2.5">
                    {plan.highlights.map((item) => (
                      <li key={item} className="flex gap-2 text-sm text-white/70">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#3B82F6]" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={MARKETING_ROUTES.bookDemo}
                    className={cn(
                      "home-btn mt-8 w-full",
                      plan.featured ? "home-btn--primary" : "home-btn--secondary",
                    )}
                  >
                    {plan.id === "enterprise" ? "Talk to sales" : "Book Demo"}
                  </Link>
                </article>
              </Reveal>
            ))}
          </div>
          <div className="mt-8">
            <Link
              href={MARKETING_ROUTES.pricing}
              className="text-sm font-semibold text-white/70 transition hover:text-white"
            >
              Compare all plans →
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="home-section home-section--tight">
        <div className="home-container">
          <Reveal>
            <p className="home-eyebrow">Testimonials</p>
            <h2 className="home-title">Operators who stopped running on fragments.</h2>
          </Reveal>
          <div className="home-quotes">
            {TESTIMONIALS.map((item, i) => (
              <Reveal key={item.name} delay={i * 0.05}>
                <blockquote className="home-card flex h-full flex-col p-7">
                  <div className="flex text-[#FBBF24]" aria-hidden="true">
                    {Array.from({ length: 5 }).map((_, star) => (
                      <Star key={star} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <p className="mt-5 flex-1 text-base leading-relaxed text-white/85">
                    &ldquo;{item.quote}&rdquo;
                  </p>
                  <footer className="mt-6 border-t border-white/10 pt-4 text-sm">
                    <span className="font-semibold text-white">{item.name}</span>
                    <span className="mt-1 block text-white/45">{item.role}</span>
                  </footer>
                </blockquote>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="home-section">
        <div className="home-container">
          <Reveal>
            <p className="home-eyebrow">FAQ</p>
            <h2 className="home-title">Answers before the first call.</h2>
          </Reveal>
          <div className="home-card mx-auto mt-10 max-w-3xl px-5 sm:px-8">
            {FAQ_ITEMS.map((item) => (
              <FaqItem key={item.q} q={item.q} a={item.a} />
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="home-section" style={{ paddingBottom: "clamp(5rem, 10vw, 8rem)" }}>
        <div className="home-container">
          <Reveal>
            <div className="home-card relative overflow-hidden px-6 py-14 text-center sm:px-12 sm:py-16">
              <div className="pointer-events-none absolute -top-20 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-[#3B82F6]/25 blur-3xl" />
              <div className="pointer-events-none absolute -right-10 -bottom-16 h-48 w-48 rounded-full bg-[#8B5CF6]/20 blur-3xl" />
              <div className="relative">
                <h2 className="font-marketing-display text-3xl tracking-tight text-white sm:text-4xl lg:text-5xl">
                  Ready to run your business with AI?
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-base text-white/60 sm:text-lg">
                  Book a guided demo, or start free and configure your first location in minutes.
                </p>
                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                  <Link href={MARKETING_ROUTES.bookDemo} className="home-btn home-btn--primary">
                    Book Demo
                  </Link>
                  <Link href={ROUTES.signup} className="home-btn home-btn--secondary">
                    Start Free
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}

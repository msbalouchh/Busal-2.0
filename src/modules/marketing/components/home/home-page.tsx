"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  BarChart3,
  Bot,
  Building2,
  CalendarCheck2,
  GraduationCap,
  Hotel,
  Calculator,
  Briefcase,
  Dumbbell,
  Megaphone,
  Users,
  Scissors,
  ShoppingBag,
  Sparkles,
  Stethoscope,
  Utensils,
  Workflow,
  Star,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";
import { HomeDashboardMockup } from "@/modules/marketing/components/home/home-dashboard-mockup";
import {
  HomeEyebrow,
  HomeFade,
  HomeHeading,
  HomeLead,
  HomeReveal,
  HomeSection,
} from "@/modules/marketing/components/home/home-reveal";
import { MARKETING_ROUTES } from "@/modules/marketing/constants/routes";
import {
  AI_AGENTS,
  BRAND,
  CUSTOMER_LOGOS,
  FAQ_ITEMS,
  PRICING,
  TESTIMONIALS,
} from "@/modules/marketing/content/site-copy";
import { AnimatedStat } from "@/modules/marketing/components/animated-stat";

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

const BUSINESS_PILLARS = [
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

const INDUSTRY_CARDS = [
  {
    name: "Restaurant",
    icon: Utensils,
    summary: "Menus, QR, kitchen, and loyalty under pressure.",
  },
  { name: "Retail", icon: ShoppingBag, summary: "Catalog, stock, and retention in one loop." },
  { name: "Salon", icon: Scissors, summary: "Bookings, retail add-ons, and repeat visits." },
  { name: "Clinic", icon: Stethoscope, summary: "Appointments and front-desk clarity." },
  { name: "Gym", icon: Dumbbell, summary: "Memberships, schedules, and engagement." },
  { name: "Hotel", icon: Hotel, summary: "Guest journeys and service coordination." },
  {
    name: "Construction",
    icon: Building2,
    summary: "Projects, suppliers, field-to-office continuity.",
  },
  { name: "Education", icon: GraduationCap, summary: "Enrollment, communications, oversight." },
  { name: "Accounting", icon: Calculator, summary: "Client work, billing, and delivery rhythm." },
  {
    name: "Professional Services",
    icon: Briefcase,
    summary: "CRM, delivery, billing, and client portals.",
  },
] as const;

const FEATURE_SHOWCASE = [
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

const METRICS = [
  { value: "20+", label: "Connected modules", hint: "POS to AI agents" },
  { value: "11", label: "Industries ready", hint: "expand without a rewrite" },
  { value: "38%", label: "Faster ticket times", hint: "in restaurant deployments" },
  { value: "24/7", label: "AI assistance", hint: "when decisions matter" },
] as const;

const PRICING_PREVIEW = PRICING.plans.filter((plan) =>
  ["starter", "growth", "enterprise"].includes(plan.id),
);

function HomeCta({
  href,
  children,
  variant = "primary",
  className,
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold transition focus-visible:ring-2 focus-visible:ring-[#3B82F6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B1020] focus-visible:outline-none motion-safe:active:scale-[0.98]",
        variant === "primary" &&
          "bg-gradient-to-r from-[#3B82F6] to-[#6366F1] text-white shadow-[0_12px_40px_-16px_rgba(59,130,246,0.85)] hover:brightness-110",
        variant === "secondary" &&
          "border border-white/15 bg-white/5 text-white backdrop-blur hover:bg-white/10",
        variant === "ghost" && "text-white/70 hover:text-white",
        className,
      )}
    >
      {children}
    </Link>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  const reduced = useReducedMotion();

  return (
    <div className="border-b border-white/10">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-4 py-5 text-left"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
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
    <div className="home-premium pb-8">
      {/* Hero */}
      <section className="relative min-h-[min(92vh,980px)] overflow-hidden pt-8 pb-16 sm:pt-12 sm:pb-20 lg:flex lg:items-center lg:pt-8 lg:pb-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_70%_20%,rgba(59,130,246,0.18),transparent_55%)]" />
        <div className="pointer-events-none absolute top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-[#8B5CF6]/10 blur-3xl" />
        <div className="relative mx-auto grid w-full max-w-[1440px] items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1.02fr_0.98fr] lg:gap-12 lg:px-10">
          <div className="max-w-xl lg:max-w-none">
            <HomeFade delay={0.05}>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.06] px-3.5 py-1.5 text-xs font-medium text-white/85 shadow-[0_0_24px_-8px_rgba(139,92,246,0.55)] backdrop-blur">
                <Sparkles className="h-3.5 w-3.5 text-[#8B5CF6]" />
                AI Operating System for Businesses
              </span>
            </HomeFade>

            <HomeFade delay={0.12}>
              <h1 className="font-marketing-display mt-7 text-4xl leading-[1.04] tracking-tight text-white sm:text-5xl lg:text-[3.65rem] xl:text-7xl">
                One platform.
                <br />
                Every operation.
                <br />
                <span className="bg-gradient-to-r from-[#3B82F6] via-[#818CF8] to-[#8B5CF6] bg-clip-text text-transparent">
                  Powered by AI.
                </span>
              </h1>
            </HomeFade>

            <HomeFade delay={0.2}>
              <p className="mt-6 max-w-lg text-base leading-relaxed text-pretty text-white/65 sm:text-lg">
                {BRAND.name} unifies orders, customers, inventory, finance, and intelligence into
                one AI-first operating system—so growing businesses run with clarity, speed, and
                control instead of fragmented tools.
              </p>
            </HomeFade>

            <HomeFade delay={0.28}>
              <div className="mt-9 flex flex-wrap gap-3">
                <HomeCta href={ROUTES.signup}>Start Free</HomeCta>
                <HomeCta href={MARKETING_ROUTES.bookDemo} variant="secondary">
                  Book Demo
                </HomeCta>
              </div>
            </HomeFade>

            <HomeFade delay={0.36}>
              <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-white/10 pt-7">
                <p className="max-w-[14rem] text-sm leading-snug text-white/55">
                  Trusted by restaurants, retailers and service businesses.
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex text-[#FBBF24]" aria-label="4.9 out of 5 stars">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <span className="text-sm font-semibold text-white">4.9</span>
                </div>
                <div>
                  <p className="text-xl font-semibold tracking-tight text-white">500+</p>
                  <p className="text-xs text-white/45">operators onboarded</p>
                </div>
              </div>
            </HomeFade>
          </div>

          <div className="home-float lg:pl-2">
            <HomeDashboardMockup />
          </div>
        </div>
      </section>

      {/* Trusted companies */}
      <section className="border-y border-white/10 py-10">
        <p className="text-center text-xs font-semibold tracking-[0.2em] text-white/40 uppercase">
          Trusted companies
        </p>
        <div className="relative mx-auto mt-6 max-w-[1440px] overflow-hidden">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[#0B1020] to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[#0B1020] to-transparent" />
          <div className="home-marquee-track flex w-max gap-10 px-4">
            {logos.map((name, i) => (
              <span
                key={`${name}-${i}`}
                className="font-marketing-display shrink-0 text-lg tracking-tight text-white/35 sm:text-xl"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* AI Capabilities */}
      <HomeSection>
        <HomeReveal>
          <HomeEyebrow>AI Capabilities</HomeEyebrow>
          <HomeHeading>Intelligence designed for how businesses actually run.</HomeHeading>
          <HomeLead>
            Six capability layers that turn live operational data into decisions your team can trust
            under pressure.
          </HomeLead>
        </HomeReveal>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {AI_CAPABILITIES.map((item, i) => (
            <HomeReveal key={item.title} delay={i * 0.05}>
              <article className="group h-full rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_20px_50px_-36px_rgba(0,0,0,0.8)] backdrop-blur transition hover:-translate-y-1 hover:border-[#3B82F6]/40 hover:bg-white/[0.06]">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#3B82F6]/25 to-[#8B5CF6]/25 text-[#93C5FD]">
                  <item.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-5 text-lg font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/55">{item.summary}</p>
              </article>
            </HomeReveal>
          ))}
        </div>
      </HomeSection>

      {/* Business Management */}
      <HomeSection className="pt-4">
        <HomeReveal>
          <HomeEyebrow>Business Management</HomeEyebrow>
          <HomeHeading>Every critical function. One operating rhythm.</HomeHeading>
          <HomeLead>
            Replace tool sprawl with a connected system for operations, growth, and finance.
          </HomeLead>
        </HomeReveal>
        <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {BUSINESS_PILLARS.map((item, i) => (
            <HomeReveal key={item.title} delay={i * 0.04}>
              <article className="h-full rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-5">
                <item.icon className="h-5 w-5 text-[#3B82F6]" />
                <h3 className="mt-4 text-base font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/55">{item.summary}</p>
              </article>
            </HomeReveal>
          ))}
        </div>
      </HomeSection>

      {/* Industries */}
      <HomeSection>
        <HomeReveal>
          <HomeEyebrow>Industries</HomeEyebrow>
          <HomeHeading>Depth for restaurants. Ready for every vertical.</HomeHeading>
          <HomeLead>
            Start where you operate today—then expand on the same multi-tenant foundation.
          </HomeLead>
        </HomeReveal>
        <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {INDUSTRY_CARDS.map((industry, i) => (
            <HomeReveal key={industry.name} delay={i * 0.03}>
              <Link
                href={MARKETING_ROUTES.industries}
                className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-[#8B5CF6]/40 hover:bg-white/[0.06]"
              >
                <industry.icon className="h-5 w-5 text-[#8B5CF6]" />
                <h3 className="mt-3 text-sm font-semibold text-white">{industry.name}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-white/50">{industry.summary}</p>
              </Link>
            </HomeReveal>
          ))}
        </div>
      </HomeSection>

      {/* Feature showcase */}
      <HomeSection>
        <HomeReveal>
          <HomeEyebrow>Feature Showcase</HomeEyebrow>
          <HomeHeading>Product depth you can feel in the first week.</HomeHeading>
        </HomeReveal>
        <div className="mt-14 space-y-20">
          {FEATURE_SHOWCASE.map((feature, index) => {
            const reverse = index % 2 === 1;
            return (
              <HomeReveal key={feature.title}>
                <div
                  className={cn(
                    "grid items-center gap-10 lg:grid-cols-2 lg:gap-14",
                    reverse && "lg:[&>*:first-child]:order-2",
                  )}
                >
                  <div>
                    <h3 className="font-marketing-display text-2xl tracking-tight text-white sm:text-3xl">
                      {feature.title}
                    </h3>
                    <p className="mt-4 text-base leading-relaxed text-white/60">
                      {feature.summary}
                    </p>
                    <ul className="mt-6 space-y-2">
                      {feature.points.map((point) => (
                        <li key={point} className="flex items-center gap-2 text-sm text-white/75">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#3B82F6]" />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-gradient-to-br from-[#12182b] via-[#0f172a] to-[#1e1b4b] p-6 shadow-2xl">
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.25),transparent_45%)]" />
                    <div className="relative space-y-3">
                      <div className="flex gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                        <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                        <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {[72, 54, 88].map((h) => (
                          <div key={h} className="rounded-xl border border-white/10 bg-white/5 p-3">
                            <div className="h-2 w-10 rounded bg-white/15" />
                            <div className="mt-3 h-8 rounded bg-gradient-to-r from-[#3B82F6]/50 to-[#8B5CF6]/40" />
                            <div
                              className="mt-2 rounded bg-white/10"
                              style={{ height: `${h / 4}px` }}
                            />
                          </div>
                        ))}
                      </div>
                      <div className="h-28 rounded-xl border border-white/10 bg-white/[0.04] p-3">
                        <div className="mb-3 h-2 w-24 rounded bg-white/15" />
                        <div className="flex h-16 items-end gap-1">
                          {[40, 65, 48, 80, 58, 90, 70].map((h, i) => (
                            <div
                              key={i}
                              className="flex-1 rounded-sm bg-gradient-to-t from-[#3B82F6]/30 to-[#8B5CF6]/80"
                              style={{ height: `${h}%` }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </HomeReveal>
            );
          })}
        </div>
      </HomeSection>

      {/* AI Assistants */}
      <HomeSection>
        <HomeReveal>
          <HomeEyebrow>AI Assistants</HomeEyebrow>
          <HomeHeading>A specialist for every critical decision.</HomeHeading>
          <HomeLead>
            Domain agents that read your live business context—and recommend the next move.
          </HomeLead>
        </HomeReveal>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {AI_AGENTS.slice(0, 6).map((agent, i) => (
            <HomeReveal key={agent.name} delay={i * 0.04}>
              <article className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-6">
                <div className="pointer-events-none absolute -top-10 -right-10 h-28 w-28 rounded-full bg-[#8B5CF6]/20 blur-2xl" />
                <div className="relative">
                  <span className="inline-flex rounded-full border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 px-2.5 py-1 text-[11px] font-semibold text-[#C4B5FD]">
                    {agent.name}
                  </span>
                  <p className="mt-4 text-sm leading-relaxed text-white/60">{agent.summary}</p>
                </div>
              </article>
            </HomeReveal>
          ))}
        </div>
        <div className="mt-8">
          <HomeCta href={MARKETING_ROUTES.ai} variant="ghost">
            Explore the AI Platform →
          </HomeCta>
        </div>
      </HomeSection>

      {/* Pricing preview */}
      <HomeSection>
        <HomeReveal>
          <HomeEyebrow>Pricing</HomeEyebrow>
          <HomeHeading>Clear plans for every stage of growth.</HomeHeading>
          <HomeLead>
            One-time implementation {PRICING.implementation.range}. Then choose the monthly plan
            that matches your ambition.
          </HomeLead>
        </HomeReveal>
        <div className="mt-12 grid gap-4 lg:grid-cols-3">
          {PRICING_PREVIEW.map((plan, i) => (
            <HomeReveal key={plan.id} delay={i * 0.06}>
              <article
                className={cn(
                  "relative flex h-full flex-col rounded-[1.75rem] border p-6 sm:p-8",
                  plan.featured
                    ? "border-[#3B82F6]/50 bg-gradient-to-b from-[#1e3a5f]/80 to-[#0B1020] shadow-[0_24px_80px_-32px_rgba(59,130,246,0.65)]"
                    : "border-white/10 bg-white/[0.03]",
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
                <HomeCta
                  href={MARKETING_ROUTES.bookDemo}
                  variant={plan.featured ? "primary" : "secondary"}
                  className="mt-8 w-full"
                >
                  {plan.id === "enterprise" ? "Talk to sales" : "Book Demo"}
                </HomeCta>
              </article>
            </HomeReveal>
          ))}
        </div>
        <div className="mt-8">
          <HomeCta href={MARKETING_ROUTES.pricing} variant="ghost">
            Compare all plans →
          </HomeCta>
        </div>
      </HomeSection>

      {/* Testimonials */}
      <HomeSection>
        <HomeReveal>
          <HomeEyebrow>Testimonials</HomeEyebrow>
          <HomeHeading>Operators who stopped running on fragments.</HomeHeading>
        </HomeReveal>
        <div className="mt-12 grid gap-4 lg:grid-cols-3">
          {TESTIMONIALS.map((item, i) => (
            <HomeReveal key={item.name} delay={i * 0.06}>
              <blockquote className="flex h-full flex-col rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-7">
                <div className="flex text-[#FBBF24]">
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
            </HomeReveal>
          ))}
        </div>
      </HomeSection>

      {/* Metrics */}
      <HomeSection>
        <HomeReveal>
          <HomeEyebrow>Customer Success</HomeEyebrow>
          <HomeHeading>Outcomes that compound after go-live.</HomeHeading>
        </HomeReveal>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {METRICS.map((stat) => (
            <HomeReveal key={stat.label}>
              <AnimatedStat
                value={stat.value}
                label={stat.label}
                hint={stat.hint}
                className="rounded-3xl border border-white/10 bg-white/[0.03] px-5 py-6"
              />
            </HomeReveal>
          ))}
        </div>
      </HomeSection>

      {/* FAQ */}
      <HomeSection>
        <HomeReveal>
          <HomeEyebrow>FAQ</HomeEyebrow>
          <HomeHeading>Answers before the first call.</HomeHeading>
        </HomeReveal>
        <div className="mx-auto mt-10 max-w-3xl rounded-[1.75rem] border border-white/10 bg-white/[0.03] px-5 sm:px-8">
          {FAQ_ITEMS.map((item) => (
            <FaqItem key={item.q} q={item.q} a={item.a} />
          ))}
        </div>
      </HomeSection>

      {/* Final CTA */}
      <HomeSection className="pb-28">
        <HomeReveal>
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#152038] via-[#0B1020] to-[#1a1030] px-6 py-14 text-center sm:px-12 sm:py-16">
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
                <HomeCta href={MARKETING_ROUTES.bookDemo}>Book Demo</HomeCta>
                <HomeCta href={ROUTES.signup} variant="secondary">
                  Start Free
                </HomeCta>
              </div>
            </div>
          </div>
        </HomeReveal>
      </HomeSection>
    </div>
  );
}

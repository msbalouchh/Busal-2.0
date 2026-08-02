"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { BadgeCheck, ChevronDown, Cloud, Cpu, Globe, Shield, Sparkles, Zap } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";
import { AnimatedStat } from "@/modules/marketing/components/animated-stat";
import { FadeIn, Reveal } from "@/modules/marketing/components/home/home-motion";
import {
  BEFORE_AFTER,
  JOURNEY_STEPS,
  SUCCESS_FAQ,
  TRUST_BADGES,
} from "@/modules/marketing/components/customer-success/customer-success-data";
import {
  SuccessGrowthDashboard,
  SuccessHeroViz,
  SuccessJourneyFlow,
} from "@/modules/marketing/components/customer-success/customer-success-visuals";
import { MARKETING_ROUTES } from "@/modules/marketing/constants/routes";

import "@/modules/marketing/components/home/home.css";
import "./customer-success.css";

const KPI_STATS = [
  { value: "2M+", label: "Orders Processed" },
  { value: "99.99%", label: "Platform Uptime" },
  { value: "35%", label: "Average Revenue Growth" },
  { value: "18", label: "Hours Saved Per Week" },
  { value: "4.9/5", label: "Customer Satisfaction" },
  { value: "50+", label: "AI Automations Running Daily" },
] as const;

const STORIES = [
  {
    industry: "Restaurant",
    title: "Harbour Kitchen Group",
    overview:
      "Three-site coastal restaurant group serving 800+ covers daily across dine-in and delivery.",
    challenges:
      "Kitchen bottlenecks, disconnected POS and loyalty, margin blind spots until month-end.",
    implementation:
      "Unified POS, kitchen display, reservations, and CRM with AI Manager briefings before service.",
    results:
      "Single order truth, faster ticket times, and loyalty tied to every cover without spreadsheet drift.",
    revenue: "+22% revenue",
    timeSaved: "16 hrs/week saved",
    efficiency: "+38% ticket speed",
    ai: ["AI Manager", "AI Inventory", "AI Waiter"],
  },
  {
    industry: "Retail Store",
    title: "Northline Retail",
    overview:
      "Multi-branch fashion and lifestyle retail with high SKU velocity and seasonal peaks.",
    challenges:
      "Stockouts on bestsellers, sell-through data arriving too late, CRM disconnected from checkout.",
    implementation:
      "Inventory, POS, and CRM on one ledger with AI replenishment and marketing segments.",
    results: "Live stock signals, fewer stockouts, and retention loops grounded in basket data.",
    revenue: "+18% sell-through",
    timeSaved: "12 hrs/week saved",
    efficiency: "22% fewer stockouts",
    ai: ["AI Inventory", "AI Marketing", "AI Analytics"],
  },
  {
    industry: "Salon",
    title: "Velvet Salons",
    overview: "Premium salon chain with chair utilisation, retail attach, and repeat visit goals.",
    challenges:
      "Empty chairs between bookings, client history scattered, campaigns not tied to visit data.",
    implementation:
      "Appointments, CRM, payments, and marketing automation with AI rebooking nudges.",
    results:
      "Higher chair utilisation, stronger retail attach, and 31% rebooking lift in six months.",
    revenue: "+31% rebooking",
    timeSaved: "10 hrs/week saved",
    efficiency: "+24% chair utilisation",
    ai: ["AI Receptionist", "AI Marketing", "AI Manager"],
  },
  {
    industry: "Clinic",
    title: "Atlas Clinics",
    overview: "Multi-practitioner clinic with high front-desk volume and follow-up coordination.",
    challenges:
      "Phone tag for confirmations, front desk overwhelmed, follow-ups falling through cracks.",
    implementation:
      "Appointments, patient CRM, billing, and AI Receptionist for booking queries and reminders.",
    results:
      "2.1× faster front-desk flow, clear booking status, and automated patient follow-up trails.",
    revenue: "+15% capacity",
    timeSaved: "14 hrs/week saved",
    efficiency: "2.1× front-desk flow",
    ai: ["AI Receptionist", "AI Support", "AI Analytics"],
  },
  {
    industry: "Gym",
    title: "Forge Fitness",
    overview: "Growing gym group with memberships, classes, and retention-focused operations.",
    challenges:
      "Churn visible only after cancellation, scheduling conflicts, billing disputes manual.",
    implementation:
      "Memberships, scheduling, CRM, and portal with AI retention signals before churn.",
    results:
      "Retention alerts weeks earlier, smoother billing, and class scheduling aligned to demand.",
    revenue: "+19% retention",
    timeSaved: "11 hrs/week saved",
    efficiency: "+26% class fill rate",
    ai: ["AI Manager", "AI Marketing", "AI Finance"],
  },
  {
    industry: "Hotel",
    title: "Summit Hospitality",
    overview:
      "Boutique hotel group coordinating F&B, front desk, and guest preferences across stays.",
    challenges:
      "Guest preferences lost between departments, RevPAR insights late, ops and finance split.",
    implementation: "Reservations, CRM, POS, housekeeping workflows, and AI guest intelligence.",
    results:
      "Guest profiles follow the stay, unified commercial view, and proactive service coordination.",
    revenue: "+17% RevPAR",
    timeSaved: "20 hrs/week saved",
    efficiency: "+21% guest satisfaction",
    ai: ["AI Manager", "AI Operations", "AI Marketing"],
  },
] as const;

const TESTIMONIALS = [
  {
    initials: "AH",
    quote:
      "We stopped juggling five systems. Orders, kitchen, and loyalty finally speak the same language.",
    name: "Amira Hassan",
    role: "Owner · Restaurant group",
    company: "Restaurant",
  },
  {
    initials: "JO",
    quote:
      "The AI briefings save our morning stand-up. We know what matters before the doors open.",
    name: "James Okonkwo",
    role: "Operations Director · Retail",
    company: "Retail",
  },
  {
    initials: "SM",
    quote:
      "Implementation felt like a partnership, not a software dump. Our team was ready on day one.",
    name: "Sofia Mendes",
    role: "General Manager · Hospitality",
    company: "Hotel",
  },
] as const;

const TRUST_ICONS = [Shield, Zap, BadgeCheck, Cloud, Globe, Cpu] as const;

function FaqItem({ q, a, defaultOpen }: { q: string; a: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  const reduced = useReducedMotion();

  return (
    <div className={cn("cs-faq__item", open && "is-open")}>
      <button
        type="button"
        className="cs-faq__trigger"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="cs-faq__question">{q}</span>
        <span className="cs-faq__chevron" aria-hidden="true">
          <ChevronDown className="h-5 w-5" />
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={reduced ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduced ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="cs-faq__answer">{a}</p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export function CustomerSuccessPage() {
  return (
    <div className="cs">
      {/* Hero */}
      <section className="cs-hero">
        <div className="cs-hero__glow" />
        <div className="home-container">
          <div className="cs-hero__grid">
            <div>
              <FadeIn delay={0.04}>
                <span className="home-hero__badge">
                  <Sparkles className="h-3.5 w-3.5 text-[#8B5CF6]" aria-hidden="true" />
                  Customer Success
                </span>
              </FadeIn>
              <FadeIn delay={0.1}>
                <h1 className="cs-hero__headline">
                  Real Businesses.
                  <br />
                  Real Growth.
                  <br />
                  <span className="cs-hero__accent">Powered by Busal OS.</span>
                </h1>
              </FadeIn>
              <FadeIn delay={0.18}>
                <p className="home-hero__desc">
                  See how businesses automate operations, increase revenue, and save hours every
                  week with Busal OS—from discovery through ongoing success.
                </p>
              </FadeIn>
              <FadeIn delay={0.26}>
                <div className="home-hero__actions">
                  <Link href={MARKETING_ROUTES.bookDemo} className="home-btn home-btn--primary">
                    Book a Demo
                  </Link>
                  <Link href={ROUTES.signup} className="home-btn home-btn--secondary">
                    Start Free Trial
                  </Link>
                </div>
              </FadeIn>
            </div>
            <FadeIn delay={0.2}>
              <SuccessHeroViz />
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Success Metrics */}
      <section className="home-section home-section--tight">
        <div className="home-container">
          <Reveal>
            <p className="home-eyebrow">Platform impact</p>
            <h2 className="home-title">Outcomes at scale.</h2>
            <p className="home-lead">
              Measurable results across orders, uptime, revenue, time saved, satisfaction, and AI
              automation.
            </p>
          </Reveal>
          <div className="cs-stats">
            {KPI_STATS.map((stat, i) => (
              <Reveal key={stat.label} delay={i * 0.04}>
                <AnimatedStat
                  value={stat.value}
                  label={stat.label}
                  className="cs-stat border-t-0 pt-0"
                />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Stories */}
      <section className="home-section">
        <div className="home-container">
          <Reveal>
            <p className="home-eyebrow">Featured Stories</p>
            <h2 className="home-title cs-title--wide">Business transformation, measured.</h2>
            <p className="home-lead">
              Six industries. Real challenges. Real implementations. Real results.
            </p>
          </Reveal>
          <div className="cs-stories">
            {STORIES.map((story, i) => (
              <Reveal key={story.title} delay={i * 0.03}>
                <article className="cs-story">
                  <span className="cs-story__industry">{story.industry}</span>
                  <h3 className="cs-story__title">{story.title}</h3>
                  <p className="cs-story__overview">{story.overview}</p>
                  <div className="cs-story__grid">
                    <div className="cs-story__block">
                      <strong>Challenges before Busal</strong>
                      <p>{story.challenges}</p>
                    </div>
                    <div className="cs-story__block">
                      <strong>Busal implementation</strong>
                      <p>{story.implementation}</p>
                    </div>
                    <div className="cs-story__block">
                      <strong>Results after Busal</strong>
                      <p>{story.results}</p>
                    </div>
                  </div>
                  <div className="cs-story__results">
                    <span className="cs-story__pill cs-story__pill--accent">{story.revenue}</span>
                    <span className="cs-story__pill">{story.timeSaved}</span>
                    <span className="cs-story__pill">{story.efficiency}</span>
                    {story.ai.map((agent) => (
                      <span key={agent} className="cs-story__pill">
                        {agent}
                      </span>
                    ))}
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Before vs After */}
      <section className="home-section home-section--tight">
        <div className="home-container">
          <Reveal>
            <p className="home-eyebrow">Before vs After</p>
            <h2 className="home-title">The shift from tool stack to operating system.</h2>
            <p className="home-lead">
              What changes when fragmented software becomes one intelligent platform.
            </p>
          </Reveal>
          <Reveal delay={0.06}>
            <div className="cs-ba">
              {BEFORE_AFTER.map((col) => (
                <div
                  key={col.phase}
                  className={cn("cs-ba__col", col.phase.startsWith("After") && "cs-ba__col--after")}
                >
                  <p className="cs-ba__phase">{col.phase}</p>
                  <ul className="cs-ba__list">
                    {col.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Growth Dashboard */}
      <section className="home-section">
        <div className="home-container">
          <Reveal>
            <p className="home-eyebrow">Growth Dashboard</p>
            <h2 className="home-title cs-title--wide">What success looks like on Busal.</h2>
            <p className="home-lead">
              Revenue, retention, efficiency, productivity, AI recommendations, and automation—one
              command view.
            </p>
          </Reveal>
          <SuccessGrowthDashboard />
        </div>
      </section>

      {/* Testimonials */}
      <section className="home-section home-section--tight">
        <div className="home-container">
          <Reveal>
            <p className="home-eyebrow">Testimonials</p>
            <h2 className="home-title">What operators say.</h2>
            <p className="home-lead">
              Verified customer voices across restaurants, retail, and hospitality.
            </p>
          </Reveal>
          <div className="cs-testimonials">
            {TESTIMONIALS.map((t, i) => (
              <Reveal key={t.name} delay={i * 0.05}>
                <blockquote className="cs-testimonial">
                  <p className="cs-testimonial__quote">&ldquo;{t.quote}&rdquo;</p>
                  <footer className="cs-testimonial__footer">
                    <span className="cs-testimonial__avatar" aria-hidden="true">
                      {t.initials}
                    </span>
                    <div>
                      <p className="cs-testimonial__name">{t.name}</p>
                      <p className="cs-testimonial__role">{t.role}</p>
                      <span className="cs-testimonial__verified">Verified customer</span>
                    </div>
                  </footer>
                </blockquote>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Implementation Journey */}
      <section className="home-section">
        <div className="home-container">
          <Reveal>
            <p className="home-eyebrow">Implementation Journey</p>
            <h2 className="home-title">Partnership from demo to ongoing success.</h2>
            <p className="home-lead">
              Every engagement follows a proven path—adapted to your branches, roles, and service
              model.
            </p>
          </Reveal>
          <Reveal delay={0.06}>
            <SuccessJourneyFlow />
          </Reveal>
          <div className="sr-only">
            <ol>
              {JOURNEY_STEPS.map((step) => (
                <li key={step.title}>
                  {step.title}: {step.desc}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Awards & Trust */}
      <section className="home-section home-section--tight">
        <div className="home-container">
          <Reveal>
            <p className="home-eyebrow">Awards & Trust</p>
            <h2 className="home-title">Built for operators who cannot afford downtime.</h2>
            <p className="home-lead">
              Enterprise-grade security, uptime, and scalability—without the enterprise sales cycle
              before you can go live.
            </p>
          </Reveal>
          <div className="cs-trust">
            {TRUST_BADGES.map((badge, i) => {
              const Icon = TRUST_ICONS[i] ?? Shield;
              return (
                <Reveal key={badge.title} delay={i * 0.03}>
                  <article className="cs-trust__card">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                    <strong>{badge.title}</strong>
                    <span>{badge.desc}</span>
                  </article>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="home-section">
        <div className="home-container">
          <Reveal>
            <p className="home-eyebrow">FAQ</p>
            <h2 className="home-title">Success questions, answered.</h2>
            <p className="home-lead">
              Implementation, migration, training, support, ROI, and security.
            </p>
          </Reveal>
          <Reveal delay={0.06}>
            <div className="cs-faq">
              {SUCCESS_FAQ.map((item, i) => (
                <FaqItem key={item.q} q={item.q} a={item.a} defaultOpen={i === 0} />
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Final CTA */}
      <section className="cs-cta" aria-labelledby="cs-cta-title">
        <div className="home-container">
          <Reveal>
            <div className="cs-cta__panel">
              <div className="cs-cta__glow cs-cta__glow--a" aria-hidden="true" />
              <div className="cs-cta__glow cs-cta__glow--b" aria-hidden="true" />
              <p className="home-eyebrow" style={{ position: "relative" }}>
                Get started
              </p>
              <h2 id="cs-cta-title" className="cs-cta__title">
                Your Success Story Starts Here.
              </h2>
              <p className="cs-cta__lead">
                Start your free trial, book a demo, or contact sales—we&apos;ll map Busal to your
                operation from day one.
              </p>
              <div className="cs-cta__actions">
                <Link href={ROUTES.signup} className="home-btn home-btn--primary">
                  Start Free Trial
                </Link>
                <Link href={MARKETING_ROUTES.bookDemo} className="home-btn home-btn--secondary">
                  Book a Demo
                </Link>
                <Link href={MARKETING_ROUTES.contact} className="home-btn home-btn--secondary">
                  Contact Sales
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}

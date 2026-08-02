"use client";

import {
  Bot,
  Cloud,
  Eye,
  Gauge,
  Heart,
  Lightbulb,
  Lock,
  Shield,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";

import { ROUTES } from "@/constants/routes";
import { AnimatedStat } from "@/modules/marketing/components/animated-stat";
import { FadeIn, Reveal } from "@/modules/marketing/components/home/home-motion";
import {
  WhyBusalArchitecture,
  WhyBusalHeroViz,
} from "@/modules/marketing/components/why-busal/why-busal-visuals";
import { MARKETING_ROUTES } from "@/modules/marketing/constants/routes";

import "@/modules/marketing/components/home/home.css";
import "./why-busal.css";

const CHAOS_TOOLS = [
  "POS",
  "CRM",
  "Bookings",
  "WhatsApp",
  "Excel",
  "Marketing",
  "Inventory",
  "Accounting",
  "Reservations",
  "Payments",
  "Reports",
] as const;

const COMPARE_ROWS = [
  ["Multiple systems", "One unified platform"],
  ["Manual work", "AI automation"],
  ["Reports", "Predictive intelligence"],
  ["Disconnected data", "One business brain"],
] as const;

const PHILOSOPHY = [
  "One platform.",
  "One login.",
  "One database.",
  "One AI.",
  "Every department connected.",
  "Every employee empowered.",
  "Every decision intelligent.",
] as const;

const PRINCIPLES = [
  {
    icon: Bot,
    title: "AI First",
    desc: "Intelligence built into operations—not bolted on as an afterthought.",
  },
  {
    icon: Zap,
    title: "Automation",
    desc: "Workflows that run across modules without Zapier glue.",
  },
  {
    icon: Shield,
    title: "Security",
    desc: "Tenant isolation, encryption, and role governance by design.",
  },
  {
    icon: Cloud,
    title: "Scalability",
    desc: "One location to enterprise group without re-platforming.",
  },
  {
    icon: Gauge,
    title: "Speed",
    desc: "Decisions in minutes, not days—powered by live operational data.",
  },
  {
    icon: Heart,
    title: "Customer Obsession",
    desc: "Implementation, training, and success as structured partnership.",
  },
  {
    icon: Lightbulb,
    title: "Innovation",
    desc: "Continuous AI and platform evolution without breaking your workflows.",
  },
  {
    icon: Lock,
    title: "Reliability",
    desc: "99.99% uptime and production-grade cloud infrastructure.",
  },
] as const;

const SWITCH_STATS = [
  { value: "18", label: "Hours saved per week" },
  { value: "35%", label: "Average revenue growth" },
  { value: "5→1", label: "Fewer software subscriptions" },
  { value: "28%", label: "Lower operating costs" },
  { value: "3×", label: "Faster decision making" },
  { value: "4.9/5", label: "Better customer experience" },
] as const;

const ROADMAP = [
  {
    title: "AI Employees",
    desc: "Domain agents for manager, reception, marketing, finance, and ops.",
  },
  {
    title: "Voice AI",
    desc: "Hands-free briefings and floor copilots during service.",
  },
  {
    title: "Predictive AI",
    desc: "Demand, staffing, and inventory forecasts before pressure hits.",
  },
  {
    title: "AI Decision Engine",
    desc: "Recommendations with human approval gates across modules.",
  },
  {
    title: "Business Intelligence",
    desc: "Narrative insights on top of live dashboards and reports.",
  },
  {
    title: "Global Integrations",
    desc: "Payments, accounting, identity, and webhooks via API gateway.",
  },
  {
    title: "Enterprise Scale",
    desc: "SSO, custom SLAs, multi-entity governance, and volume pricing.",
  },
] as const;

const TRUST = [
  {
    icon: Shield,
    title: "Enterprise security",
    desc: "Encrypted data, audit trails, and hardened production infrastructure.",
  },
  {
    icon: Cloud,
    title: "Cloud infrastructure",
    desc: "Always-on hosting with redundancy—zero server maintenance.",
  },
  {
    icon: Zap,
    title: "99.99% uptime",
    desc: "Production reliability operators depend on every service day.",
  },
  {
    icon: Users,
    title: "Multi-tenant architecture",
    desc: "Isolated business data with platform-level governance.",
  },
  {
    icon: Lock,
    title: "Role-based permissions",
    desc: "Branch-scoped access by responsibility and sensitivity.",
  },
  {
    icon: Eye,
    title: "Encrypted data",
    desc: "Protected in transit and at rest with modern standards.",
  },
] as const;

export function WhyBusalPage() {
  return (
    <div className="wb">
      {/* Hero */}
      <section className="wb-hero">
        <div className="wb-hero__glow" />
        <div className="home-container">
          <div className="wb-hero__grid">
            <div>
              <FadeIn delay={0.04}>
                <span className="home-hero__badge">
                  <Sparkles className="h-3.5 w-3.5 text-[#8B5CF6]" aria-hidden="true" />
                  Why Busal
                </span>
              </FadeIn>
              <FadeIn delay={0.1}>
                <h1 className="wb-hero__headline">
                  Business software is broken.
                  <br />
                  <span className="wb-hero__accent">Busal OS fixes it.</span>
                </h1>
              </FadeIn>
              <FadeIn delay={0.18}>
                <p className="home-hero__desc">
                  Most businesses juggle multiple disconnected tools. Busal replaces them with one
                  intelligent AI Operating System—so you grow the business, not the software stack.
                </p>
              </FadeIn>
              <FadeIn delay={0.26}>
                <div className="home-hero__actions">
                  <Link href={ROUTES.signup} className="home-btn home-btn--primary">
                    Start Free Trial
                  </Link>
                  <Link href={MARKETING_ROUTES.bookDemo} className="home-btn home-btn--secondary">
                    Book Demo
                  </Link>
                </div>
              </FadeIn>
            </div>
            <FadeIn delay={0.2}>
              <WhyBusalHeroViz />
            </FadeIn>
          </div>
        </div>
      </section>

      {/* The Problem */}
      <section className="home-section home-section--tight">
        <div className="home-container">
          <Reveal>
            <p className="home-eyebrow">The Problem</p>
            <h2 className="home-title wb-title--wide">The chaos of modern business software.</h2>
            <p className="home-lead">
              Every tool adds a subscription, a login, and a reconciliation step. Operations pay the
              tax—every single week.
            </p>
          </Reveal>
          <Reveal delay={0.06}>
            <div className="wb-chaos">
              <div className="wb-chaos__grid">
                {CHAOS_TOOLS.map((tool) => (
                  <span key={tool} className="wb-chaos__chip">
                    {tool}
                  </span>
                ))}
              </div>
              <p className="wb-chaos__punch">
                Too many tools. Too many subscriptions. Too much manual work.
                <em>The stack grows. The business slows.</em>
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* The Busal Difference */}
      <section className="home-section">
        <div className="home-container">
          <Reveal>
            <p className="home-eyebrow">The Busal Difference</p>
            <h2 className="home-title">Traditional software vs Busal AI Operating System.</h2>
            <p className="home-lead">
              The difference isn&apos;t feature count—it&apos;s whether your business runs on one
              intelligent spine.
            </p>
          </Reveal>
          <Reveal delay={0.06}>
            <div className="wb-compare">
              <div className="wb-compare__head">
                <span>Traditional Software</span>
                <span>Busal AI OS</span>
              </div>
              {COMPARE_ROWS.map(([trad, busal]) => (
                <div key={trad} className="wb-compare__row">
                  <span>{trad}</span>
                  <span aria-hidden="true">vs</span>
                  <span>{busal}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Philosophy */}
      <section className="home-section home-section--tight">
        <div className="home-container">
          <Reveal>
            <p className="home-eyebrow">Philosophy</p>
            <h2 className="home-title">Our vision for how business software should work.</h2>
          </Reveal>
          <Reveal delay={0.06}>
            <div className="wb-philosophy">
              <ul className="wb-philosophy__lines">
                {PHILOSOPHY.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Core Principles */}
      <section className="home-section">
        <div className="home-container">
          <Reveal>
            <p className="home-eyebrow">Core Principles</p>
            <h2 className="home-title wb-title--wide">What we build every feature on.</h2>
            <p className="home-lead">
              Eight principles that guide every module, agent, and implementation engagement.
            </p>
          </Reveal>
          <div className="wb-principles">
            {PRINCIPLES.map((item, i) => (
              <Reveal key={item.title} delay={i * 0.03}>
                <article className="wb-principle">
                  <item.icon className="h-5 w-5" aria-hidden="true" />
                  <strong>{item.title}</strong>
                  <span>{item.desc}</span>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture */}
      <section className="home-section home-section--tight">
        <div className="home-container">
          <Reveal>
            <p className="home-eyebrow">Busal Architecture</p>
            <h2 className="home-title">From customers to growth—one connected flow.</h2>
            <p className="home-lead">
              Every signal flows through Busal AI Core—connecting operations, insights, and
              compounding growth.
            </p>
          </Reveal>
          <Reveal delay={0.06}>
            <WhyBusalArchitecture />
          </Reveal>
        </div>
      </section>

      {/* Why Businesses Switch */}
      <section className="home-section">
        <div className="home-container">
          <Reveal>
            <p className="home-eyebrow">Why Businesses Switch</p>
            <h2 className="home-title">Outcomes operators measure after leaving the tool stack.</h2>
            <p className="home-lead">
              Time back, revenue up, costs down, decisions faster, customers happier.
            </p>
          </Reveal>
          <div className="wb-switch">
            {SWITCH_STATS.map((stat, i) => (
              <Reveal key={stat.label} delay={i * 0.04}>
                <AnimatedStat
                  value={stat.value}
                  label={stat.label}
                  className="wb-switch__stat border-t-0 pt-0"
                />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Built for Tomorrow */}
      <section className="home-section home-section--tight">
        <div className="home-container">
          <Reveal>
            <p className="home-eyebrow">Built for Tomorrow</p>
            <h2 className="home-title wb-title--wide">The roadmap ahead.</h2>
            <p className="home-lead">
              AI employees, voice, predictive intelligence, and enterprise scale—always behind
              permission boundaries and tenant isolation.
            </p>
          </Reveal>
          <div className="wb-roadmap">
            {ROADMAP.map((item, i) => (
              <Reveal key={item.title} delay={i * 0.03}>
                <article className="wb-roadmap__item">
                  <strong>{item.title}</strong>
                  <span>{item.desc}</span>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="home-section">
        <div className="home-container">
          <Reveal>
            <p className="home-eyebrow">Trust</p>
            <h2 className="home-title">Enterprise foundations from day one.</h2>
            <p className="home-lead">
              Security, uptime, and governance—without the enterprise sales cycle before you can go
              live.
            </p>
          </Reveal>
          <div className="wb-trust">
            {TRUST.map((item, i) => (
              <Reveal key={item.title} delay={i * 0.03}>
                <article className="wb-trust__card">
                  <item.icon className="h-5 w-5" aria-hidden="true" />
                  <strong>{item.title}</strong>
                  <span>{item.desc}</span>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="wb-cta" aria-labelledby="wb-cta-title">
        <div className="home-container">
          <Reveal>
            <div className="wb-cta__panel">
              <div className="wb-cta__glow wb-cta__glow--a" aria-hidden="true" />
              <div className="wb-cta__glow wb-cta__glow--b" aria-hidden="true" />
              <p className="home-eyebrow" style={{ position: "relative" }}>
                Get started
              </p>
              <h2 id="wb-cta-title" className="wb-cta__title">
                Stop managing software.
                <br />
                Start growing your business.
              </h2>
              <p className="wb-cta__lead">
                Start your free trial, book a demo, or contact sales—we&apos;ll show you why one
                operating system changes everything.
              </p>
              <div className="wb-cta__actions">
                <Link href={ROUTES.signup} className="home-btn home-btn--primary">
                  Start Free Trial
                </Link>
                <Link href={MARKETING_ROUTES.bookDemo} className="home-btn home-btn--secondary">
                  Book Demo
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

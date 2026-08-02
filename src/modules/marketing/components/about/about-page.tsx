"use client";

import {
  ArrowRight,
  BarChart3,
  Bot,
  Building2,
  Cloud,
  Code2,
  Heart,
  Layers,
  Lightbulb,
  Lock,
  RefreshCw,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Workflow,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";
import { FadeIn, Reveal } from "@/modules/marketing/components/home/home-motion";
import {
  AboutGlobalViz,
  AboutHeroViz,
  AboutTimeline,
} from "@/modules/marketing/components/about/about-visuals";
import { MARKETING_ROUTES } from "@/modules/marketing/constants/routes";

import "@/modules/marketing/components/home/home.css";
import "./about.css";

const VALUES = [
  {
    icon: Heart,
    title: "Customer First",
    desc: "Every product decision starts with the operator on the floor—not the feature checklist.",
  },
  {
    icon: Bot,
    title: "AI Innovation",
    desc: "Intelligence embedded in workflows, not bolted on as an afterthought.",
  },
  {
    icon: Layers,
    title: "Simplicity",
    desc: "Complex operations deserve simple interfaces—one login, one platform.",
  },
  {
    icon: Shield,
    title: "Trust",
    desc: "Transparent security, reliable uptime, and honest partnership from day one.",
  },
  {
    icon: Lock,
    title: "Reliability",
    desc: "Production-grade infrastructure operators depend on every service day.",
  },
  {
    icon: RefreshCw,
    title: "Continuous Improvement",
    desc: "Ship weekly, listen daily, and evolve with every customer engagement.",
  },
  {
    icon: Shield,
    title: "Security",
    desc: "Tenant isolation, encryption, and role governance by design.",
  },
  {
    icon: Target,
    title: "Long-Term Thinking",
    desc: "Build for decades of growth—not quarterly feature churn.",
  },
] as const;

const TECH_PILLARS = [
  {
    icon: Bot,
    title: "AI Engine",
    desc: "Domain agents, predictive models, and natural-language intelligence across every module.",
  },
  {
    icon: Cloud,
    title: "Cloud Infrastructure",
    desc: "Always-on hosting with redundancy—zero server maintenance for operators.",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    desc: "Multi-tenant isolation, encrypted data, and role-based access controls.",
  },
  {
    icon: Workflow,
    title: "Automation",
    desc: "Cross-module workflows that eliminate manual handoffs and reconciliation.",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    desc: "Live operational intelligence—not reports that arrive weeks too late.",
  },
  {
    icon: Layers,
    title: "Integrations",
    desc: "Connect payments, accounting, marketing, and third-party tools natively.",
  },
  {
    icon: TrendingUp,
    title: "Scalability",
    desc: "One location to enterprise group without re-platforming or data migration.",
  },
] as const;

const JOURNEY = [
  {
    icon: Users,
    title: "Customers",
    desc: "Join thousands of operators running smarter on one AI operating system.",
    href: MARKETING_ROUTES.customerSuccess,
    cta: "See success stories",
  },
  {
    icon: Building2,
    title: "Partners",
    desc: "Resellers, integrators, and technology partners building on Busal OS.",
    href: MARKETING_ROUTES.partners,
    cta: "Partner with us",
  },
  {
    icon: Code2,
    title: "Developers",
    desc: "Build integrations, extensions, and custom workflows on our platform.",
    href: MARKETING_ROUTES.resources,
    cta: "Explore resources",
  },
  {
    icon: TrendingUp,
    title: "Investors",
    desc: "Backing the AI operating system category for global business operations.",
    href: MARKETING_ROUTES.contact,
    cta: "Get in touch",
  },
  {
    icon: Lightbulb,
    title: "Careers",
    desc: "Help us build the future of business software—remote-first, mission-driven.",
    href: MARKETING_ROUTES.careers,
    cta: "View open roles",
  },
] as const;

export function AboutPage() {
  const [activeValue, setActiveValue] = useState<number | null>(null);

  return (
    <div className="ab">
      {/* Hero */}
      <section className="ab-hero">
        <div className="ab-hero__glow" />
        <div className="home-container">
          <div className="ab-hero__grid">
            <div>
              <FadeIn delay={0.04}>
                <span className="home-hero__badge">
                  <Sparkles className="h-3.5 w-3.5 text-[#8B5CF6]" aria-hidden="true" />
                  About Busal
                </span>
              </FadeIn>
              <FadeIn delay={0.1}>
                <h1 className="ab-hero__headline">
                  Building the Future of
                  <br />
                  <span className="ab-hero__accent">Business Operations.</span>
                </h1>
              </FadeIn>
              <FadeIn delay={0.18}>
                <p className="home-hero__desc">
                  Busal OS is creating the AI Operating System that will power the next generation
                  of businesses—from local restaurants to global enterprises.
                </p>
              </FadeIn>
              <FadeIn delay={0.26}>
                <div className="home-hero__actions">
                  <Link href={MARKETING_ROUTES.platform} className="home-btn home-btn--primary">
                    Explore Platform
                  </Link>
                  <Link href={MARKETING_ROUTES.bookDemo} className="home-btn home-btn--secondary">
                    Book a Demo
                  </Link>
                </div>
              </FadeIn>
            </div>
            <FadeIn delay={0.2}>
              <AboutHeroViz />
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="home-section home-section--tight">
        <div className="home-container">
          <Reveal>
            <p className="home-eyebrow">Our Mission</p>
            <h2 className="home-title">Our Mission</h2>
          </Reveal>
          <Reveal delay={0.06}>
            <div className="ab-statement">
              <p>
                Empower every business with enterprise-grade AI, automation and intelligent
                operations through one unified platform.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Vision */}
      <section className="home-section">
        <div className="home-container">
          <Reveal>
            <p className="home-eyebrow">Our Vision</p>
            <h2 className="home-title">Our Vision</h2>
          </Reveal>
          <Reveal delay={0.06}>
            <div className="ab-statement ab-statement--vision">
              <p>
                Become the world&apos;s leading AI Operating System that helps millions of
                businesses operate smarter, faster and more profitably.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Story Timeline */}
      <section className="home-section home-section--tight">
        <div className="home-container">
          <Reveal>
            <p className="home-eyebrow">Our Story</p>
            <h2 className="home-title ab-title--wide">From problem to global platform.</h2>
            <p className="home-lead">
              Every great platform starts with a problem worth solving—and a conviction that
              business software can be better.
            </p>
          </Reveal>
          <AboutTimeline />
        </div>
      </section>

      {/* Core Values */}
      <section className="home-section">
        <div className="home-container">
          <Reveal>
            <p className="home-eyebrow">Core Values</p>
            <h2 className="home-title">What guides everything we build.</h2>
            <p className="home-lead">
              Eight principles that shape our product, our partnerships, and our culture.
            </p>
          </Reveal>
          <div className="ab-values">
            {VALUES.map((item, i) => (
              <Reveal key={item.title} delay={i * 0.03}>
                <article
                  className={cn("ab-value", activeValue === i && "ab-value--active")}
                  onMouseEnter={() => setActiveValue(i)}
                  onMouseLeave={() => setActiveValue(null)}
                  onFocus={() => setActiveValue(i)}
                  onBlur={() => setActiveValue(null)}
                  tabIndex={0}
                >
                  <item.icon className="h-5 w-5" aria-hidden="true" />
                  <strong>{item.title}</strong>
                  <span>{item.desc}</span>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Why We Built Busal */}
      <section className="home-section home-section--tight">
        <div className="home-container">
          <Reveal>
            <p className="home-eyebrow">Why We Built Busal</p>
            <h2 className="home-title">The problem we set out to solve.</h2>
          </Reveal>
          <Reveal delay={0.06}>
            <div className="ab-built">
              <div className="ab-built__panel ab-built__panel--problem">
                <strong>The problem</strong>
                <p>Businesses use too many disconnected tools.</p>
              </div>
              <div className="ab-built__panel ab-built__panel--solution">
                <strong>The Busal answer</strong>
                <p>Busal replaces them with one intelligent platform.</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Technology */}
      <section className="home-section">
        <div className="home-container">
          <Reveal>
            <p className="home-eyebrow">Technology</p>
            <h2 className="home-title ab-title--wide">The pillars behind Busal OS.</h2>
            <p className="home-lead">
              Enterprise-grade foundations engineered for AI-first business operations at any scale.
            </p>
          </Reveal>
          <div className="ab-tech">
            {TECH_PILLARS.map((item, i) => (
              <Reveal key={item.title} delay={i * 0.03}>
                <article className="ab-tech__item">
                  <item.icon className="h-5 w-5" aria-hidden="true" />
                  <strong>{item.title}</strong>
                  <span>{item.desc}</span>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Global Vision */}
      <section className="home-section home-section--tight">
        <div className="home-container">
          <Reveal>
            <p className="home-eyebrow">Global Vision</p>
            <h2 className="home-title">One OS for every industry, everywhere.</h2>
          </Reveal>
          <div className="ab-globe-wrap">
            <Reveal delay={0.06}>
              <AboutGlobalViz />
            </Reveal>
            <Reveal delay={0.1}>
              <div className="ab-globe__copy">
                <p>
                  Busal OS is built for service businesses across continents—restaurants, retail,
                  healthcare, hospitality, professional services, logistics, education, and beyond.
                </p>
                <p>
                  Our architecture adapts to industry workflows while sharing one AI core, one data
                  model, and one intelligence layer—so every operator benefits from platform
                  evolution.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Join Our Journey */}
      <section className="home-section">
        <div className="home-container">
          <Reveal>
            <p className="home-eyebrow">Join Our Journey</p>
            <h2 className="home-title">Be part of what we&apos;re building.</h2>
            <p className="home-lead">
              Whether you operate, partner, build, invest, or want to join the team—there&apos;s a
              place for you in the Busal story.
            </p>
          </Reveal>
          <div className="ab-journey">
            {JOURNEY.map((item, i) => (
              <Reveal key={item.title} delay={i * 0.04}>
                <Link href={item.href} className="ab-journey__card">
                  <item.icon className="h-5 w-5" aria-hidden="true" />
                  <strong>{item.title}</strong>
                  <span>{item.desc}</span>
                  <span className="ab-journey__link">
                    {item.cta}
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="ab-cta" aria-labelledby="ab-cta-title">
        <div className="home-container">
          <Reveal>
            <div className="ab-cta__panel">
              <div className="ab-cta__glow ab-cta__glow--a" aria-hidden="true" />
              <div className="ab-cta__glow ab-cta__glow--b" aria-hidden="true" />
              <p className="home-eyebrow" style={{ position: "relative" }}>
                Get started
              </p>
              <h2 id="ab-cta-title" className="ab-cta__title">
                We&apos;re Just Getting Started.
              </h2>
              <p className="ab-cta__lead">
                Start your free trial, book a demo, or contact sales—we&apos;d love to show you what
                the future of business operations looks like.
              </p>
              <div className="ab-cta__actions">
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

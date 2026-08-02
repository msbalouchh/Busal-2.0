"use client";

import {
  BarChart3,
  Building2,
  CalendarDays,
  Cloud,
  CreditCard,
  Database,
  Gift,
  Globe,
  KeyRound,
  Layers,
  Lock,
  Megaphone,
  RefreshCw,
  Server,
  Shield,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Store,
  Users,
  UtensilsCrossed,
  Workflow,
  Zap,
} from "lucide-react";
import Link from "next/link";

import { ROUTES } from "@/constants/routes";
import { AnimatedStat } from "@/modules/marketing/components/animated-stat";
import { FadeIn, Reveal } from "@/modules/marketing/components/home/home-motion";
import {
  PlatformArchitectureViz,
  PlatformPreviewDashboard,
} from "@/modules/marketing/components/platform/platform-visuals";
import { MARKETING_ROUTES } from "@/modules/marketing/constants/routes";

import "@/modules/marketing/components/home/home.css";
import "./platform.css";

const ECOSYSTEM = [
  "Restaurant",
  "Orders",
  "POS",
  "CRM",
  "Reservations",
  "Kitchen",
  "Inventory",
  "Marketing",
  "Finance",
  "Analytics",
  "AI",
] as const;

const ARCH_LAYERS = [
  { name: "Business", desc: "Your brand, branches, and teams" },
  { name: "Modules", desc: "POS, CRM, kitchen, inventory, finance" },
  { name: "AI Layer", desc: "Domain agents with live context" },
  { name: "Analytics", desc: "Dashboards and narrative insights" },
  { name: "Automation", desc: "Workflows and approvals" },
  { name: "Insights", desc: "Recommendations that compound" },
] as const;

const MODULES = [
  {
    icon: Building2,
    title: "Business Management",
    desc: "Branches, settings, and day-to-day control.",
  },
  { icon: Users, title: "Staff", desc: "Roles, permissions, and people operations." },
  { icon: Store, title: "POS", desc: "Fast checkout and live order flow." },
  { icon: ShoppingCart, title: "Orders", desc: "Capture, route, and fulfil every ticket." },
  { icon: CalendarDays, title: "Reservations", desc: "Covers, tables, and guest journeys." },
  {
    icon: UtensilsCrossed,
    title: "Kitchen Display",
    desc: "Queue built for real service pressure.",
  },
  { icon: Database, title: "Inventory", desc: "Stock, suppliers, and cost control." },
  { icon: Users, title: "CRM", desc: "Profiles, history, and next best action." },
  { icon: Megaphone, title: "Marketing", desc: "Campaigns grounded in live data." },
  { icon: Gift, title: "Loyalty", desc: "Rewards tied to every visit." },
  { icon: CreditCard, title: "Payments", desc: "Receipts, deposits, and reconciliation." },
  { icon: BarChart3, title: "Reports", desc: "Executive clarity in minutes." },
] as const;

const WORKFLOW = [
  { title: "Customer books table", detail: "Guest selects time and party size" },
  { title: "Reservation", detail: "Synced to floor plan and CRM profile" },
  { title: "POS", detail: "Orders captured at table or counter" },
  { title: "Kitchen", detail: "Tickets routed to the right station" },
  { title: "Payment", detail: "Split bills, tips, and instant receipts" },
  { title: "CRM", detail: "Visit history and preferences updated" },
  { title: "Loyalty", detail: "Points and tiers applied automatically" },
  { title: "AI Recommendations", detail: "Next visit, upsell, and staffing signals" },
] as const;

const SCALE = [
  { icon: Globe, title: "Unlimited locations", desc: "Scale from one site to a national group." },
  { icon: Layers, title: "Multi-tenant", desc: "Isolated data with platform governance." },
  { icon: KeyRound, title: "Role permissions", desc: "Branch-scoped access by design." },
  { icon: Cloud, title: "Cloud", desc: "Always-on infrastructure, zero maintenance." },
  { icon: Shield, title: "Security", desc: "Enterprise discipline from day one." },
  { icon: RefreshCw, title: "Backups", desc: "Continuous protection and recovery paths." },
  { icon: Zap, title: "API", desc: "Integrate payments, accounting, and identity." },
  { icon: Workflow, title: "Automation", desc: "Rules and agents across modules." },
] as const;

const COMPARE_ROWS = [
  ["Data model", "Disconnected tools and exports", "One shared operating spine"],
  ["AI context", "Generic chat, no live ops data", "Domain agents on live modules"],
  ["Multi-branch", "Bolted on later", "Built in from the start"],
  ["Implementation", "Login email and PDF", "Structured discovery to go-live"],
  ["Cost of change", "Re-sync tax every week", "Change once, everywhere updates"],
] as const;

const STATS = [
  { value: "500+", label: "Businesses", hint: "on Busal OS" },
  { value: "2M+", label: "Orders processed", hint: "and counting" },
  { value: "£50M+", label: "Revenue tracked", hint: "through the platform" },
  { value: "10k+", label: "Automation hours saved", hint: "per month" },
  { value: "98%", label: "Customer satisfaction", hint: "average CSAT" },
] as const;

const SECURITY = [
  {
    icon: Lock,
    title: "Encrypted",
    desc: "Data protected in transit and at rest with modern TLS and storage encryption.",
  },
  {
    icon: ShieldCheck,
    title: "Secure by design",
    desc: "Tenant isolation, hardened headers, and continuous monitoring pathways.",
  },
  {
    icon: Globe,
    title: "GDPR ready",
    desc: "Privacy controls and data handling aligned with UK and EU expectations.",
  },
  {
    icon: KeyRound,
    title: "Role-based access",
    desc: "Permissions scoped by business, branch, and responsibility.",
  },
  {
    icon: Server,
    title: "Cloud infrastructure",
    desc: "Production-grade hosting with redundancy and operational oversight.",
  },
] as const;

export function PlatformPage() {
  return (
    <div className="platform">
      {/* Hero */}
      <section className="platform-hero">
        <div className="platform-hero__glow" />
        <div className="home-container">
          <div className="platform-hero__grid">
            <div>
              <FadeIn delay={0.04}>
                <span className="home-hero__badge">
                  <Sparkles className="h-3.5 w-3.5 text-[#8B5CF6]" aria-hidden="true" />
                  The Business Operating System
                </span>
              </FadeIn>
              <FadeIn delay={0.1}>
                <h1 className="platform-hero__headline">
                  One platform.
                  <br />
                  Every business operation.
                  <br />
                  <span className="platform-hero__accent">Powered by AI.</span>
                </h1>
              </FadeIn>
              <FadeIn delay={0.18}>
                <p className="home-hero__desc">
                  Busal OS connects every department—operations, customers, finance, and
                  intelligence—inside one intelligent operating system. No sync tax. No spreadsheet
                  drift. One source of truth for how your business actually runs.
                </p>
              </FadeIn>
              <FadeIn delay={0.26}>
                <div className="home-hero__actions">
                  <Link href={MARKETING_ROUTES.bookDemo} className="home-btn home-btn--primary">
                    Book Demo
                  </Link>
                  <Link href={ROUTES.signup} className="home-btn home-btn--secondary">
                    Start Free
                  </Link>
                </div>
              </FadeIn>
            </div>
            <FadeIn delay={0.2}>
              <PlatformArchitectureViz />
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Business Operating System */}
      <section className="home-section">
        <div className="home-container">
          <Reveal>
            <p className="home-eyebrow">Business Operating System</p>
            <h2 className="home-title platform-title--wide">
              Every module connected. Every signal shared.
            </h2>
            <p className="home-lead">
              From the first reservation to the final receipt, Busal weaves operations, customers,
              and intelligence into one living system—not a pile of integrations.
            </p>
          </Reveal>
          <Reveal delay={0.06}>
            <div className="platform-eco">
              <div className="platform-eco__grid">
                <span className="platform-eco__chip platform-eco__chip--hub">Restaurant</span>
                {ECOSYSTEM.filter((m) => m !== "Restaurant").map((mod) => (
                  <span key={mod} className="platform-eco__chip">
                    {mod}
                  </span>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Platform Architecture */}
      <section className="home-section home-section--tight">
        <div className="home-container">
          <Reveal>
            <p className="home-eyebrow">Platform Architecture</p>
            <h2 className="home-title">Enterprise layers. Operator simplicity.</h2>
            <p className="home-lead">
              A modern stack that flows from your business down to actionable insights—without
              forcing teams to learn five different products.
            </p>
          </Reveal>
          <Reveal delay={0.08}>
            <div className="platform-stack">
              {ARCH_LAYERS.map((layer, i) => (
                <div key={layer.name}>
                  <div className="platform-stack__layer">
                    <strong>{layer.name}</strong>
                    <span>{layer.desc}</span>
                  </div>
                  {i < ARCH_LAYERS.length - 1 ? (
                    <div className="platform-stack__arrow" aria-hidden="true">
                      ↓
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Core Platform Modules */}
      <section className="home-section">
        <div className="home-container">
          <Reveal>
            <p className="home-eyebrow">Core Platform Modules</p>
            <h2 className="home-title platform-title--wide">
              Everything you need to run the business—native.
            </h2>
            <p className="home-lead">
              Twelve connected modules with the depth of point solutions and the coherence of one
              operating system.
            </p>
          </Reveal>
          <div className="platform-modules">
            {MODULES.map((mod, i) => (
              <Reveal key={mod.title} delay={i * 0.03}>
                <article className="platform-module">
                  <span className="platform-module__icon" aria-hidden="true">
                    <mod.icon className="h-5 w-5" />
                  </span>
                  <h3 className="platform-module__title">{mod.title}</h3>
                  <p className="platform-module__desc">{mod.desc}</p>
                  <div className="platform-module__preview" aria-hidden="true">
                    <div className="platform-module__preview-bar" />
                    <div className="platform-module__preview-bar" />
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Everything Works Together */}
      <section className="home-section home-section--tight">
        <div className="home-container">
          <Reveal>
            <p className="home-eyebrow">Connected Workflow</p>
            <h2 className="home-title">Everything works together.</h2>
            <p className="home-lead">
              One guest journey—from booking to loyalty—touching every module without manual
              handoffs.
            </p>
          </Reveal>
          <Reveal delay={0.06}>
            <div className="platform-workflow">
              {WORKFLOW.map((step) => (
                <div key={step.title} className="platform-workflow__step">
                  <strong>{step.title}</strong>
                  <span>{step.detail}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Built for Scale */}
      <section className="home-section">
        <div className="home-container">
          <Reveal>
            <p className="home-eyebrow">Built for Scale</p>
            <h2 className="home-title">From first location to enterprise group.</h2>
            <p className="home-lead">
              Multi-tenant architecture, role governance, and cloud reliability—ready when you
              outgrow spreadsheets.
            </p>
          </Reveal>
          <div className="platform-scale">
            {SCALE.map((item, i) => (
              <Reveal key={item.title} delay={i * 0.03}>
                <article className="platform-scale__card">
                  <item.icon className="h-5 w-5" aria-hidden="true" />
                  <strong>{item.title}</strong>
                  <span>{item.desc}</span>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Why Businesses Choose Busal */}
      <section className="home-section home-section--tight">
        <div className="home-container">
          <Reveal>
            <p className="home-eyebrow">Why Busal</p>
            <h2 className="home-title">Traditional software vs Busal OS.</h2>
            <p className="home-lead">
              The difference isn&apos;t feature count—it&apos;s whether your tools share one
              operating rhythm.
            </p>
          </Reveal>
          <Reveal delay={0.06}>
            <div className="platform-compare">
              <div className="platform-compare__head">
                <span>Capability</span>
                <span>Traditional software</span>
                <span>Busal OS</span>
              </div>
              {COMPARE_ROWS.map(([cap, trad, busal]) => (
                <div key={cap} className="platform-compare__row">
                  <span>{cap}</span>
                  <span>{trad}</span>
                  <span>{busal}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Live Platform Preview */}
      <section className="home-section">
        <div className="home-container">
          <Reveal>
            <p className="home-eyebrow">Live Preview</p>
            <h2 className="home-title platform-title--wide">
              See the platform your team will run on.
            </h2>
            <p className="home-lead">
              Analytics, orders, staff, AI, CRM, reservations, and revenue—one command view.
            </p>
          </Reveal>
          <Reveal delay={0.08}>
            <PlatformPreviewDashboard />
          </Reveal>
        </div>
      </section>

      {/* Statistics */}
      <section className="home-section home-section--tight">
        <div className="home-container">
          <Reveal>
            <p className="home-eyebrow">By the numbers</p>
            <h2 className="home-title">Platform impact at scale.</h2>
          </Reveal>
          <div className="platform-stats">
            {STATS.map((stat, i) => (
              <Reveal key={stat.label} delay={i * 0.04}>
                <AnimatedStat
                  value={stat.value}
                  label={stat.label}
                  hint={stat.hint}
                  className="platform-stat border-t-0 pt-0"
                />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Enterprise Security */}
      <section className="home-section">
        <div className="home-container">
          <Reveal>
            <p className="home-eyebrow">Enterprise Security</p>
            <h2 className="home-title">Trust built into every layer.</h2>
            <p className="home-lead">
              Security and compliance aren&apos;t add-ons—they&apos;re part of the operating system
              your business runs on.
            </p>
          </Reveal>
          <div className="platform-security">
            {SECURITY.map((item, i) => (
              <Reveal key={item.title} delay={i * 0.04}>
                <article className="platform-security__card">
                  <item.icon className="h-6 w-6" aria-hidden="true" />
                  <strong>{item.title}</strong>
                  <p>{item.desc}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="platform-cta" aria-labelledby="platform-cta-title">
        <div className="home-container">
          <Reveal>
            <div className="platform-cta__panel">
              <div className="platform-cta__glow platform-cta__glow--a" aria-hidden="true" />
              <div className="platform-cta__glow platform-cta__glow--b" aria-hidden="true" />
              <p className="home-eyebrow" style={{ position: "relative" }}>
                Get started
              </p>
              <h2 id="platform-cta-title" className="platform-cta__title">
                Ready to run your business from one intelligent platform?
              </h2>
              <p className="platform-cta__lead">
                Start free today, or book a demo and we&apos;ll map Busal to your exact operation.
              </p>
              <div className="platform-cta__actions">
                <Link href={ROUTES.signup} className="home-btn home-btn--primary">
                  Start Free
                </Link>
                <Link href={MARKETING_ROUTES.bookDemo} className="home-btn home-btn--secondary">
                  Book Demo
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}

"use client";

import {
  BarChart3,
  Building2,
  CalendarDays,
  Clock,
  Cloud,
  CreditCard,
  Database,
  Gift,
  Globe,
  KeyRound,
  Layers,
  LayoutGrid,
  Megaphone,
  Package,
  QrCode,
  Server,
  Shield,
  ShoppingBag,
  Sparkles,
  Store,
  TrendingUp,
  Truck,
  Users,
  UtensilsCrossed,
  Workflow,
  Zap,
} from "lucide-react";
import Link from "next/link";

import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";
import { FadeIn, Reveal } from "@/modules/marketing/components/home/home-motion";
import {
  FeatureUiPreview,
  FeaturesHeroDashboard,
  FeaturesWorkflow,
} from "@/modules/marketing/components/features/features-visuals";
import { MARKETING_ROUTES } from "@/modules/marketing/constants/routes";

import "@/modules/marketing/components/home/home.css";
import "./features.css";

const CORE_FEATURES = [
  {
    id: "business",
    title: "Business Management",
    icon: Building2,
    desc: "Branches, settings, documents, and day-to-day control in one admin hub.",
  },
  {
    id: "pos",
    title: "POS",
    icon: CreditCard,
    desc: "Fast checkout, split payments, receipts, and live order capture.",
  },
  {
    id: "qr-menu",
    title: "QR Menu",
    icon: QrCode,
    desc: "Guest-facing menus and orders that sync straight to the kitchen.",
  },
  {
    id: "reservations",
    title: "Reservations",
    icon: CalendarDays,
    desc: "Covers, waitlists, and guest journeys without double-booking.",
  },
  {
    id: "tables",
    title: "Table Management",
    icon: LayoutGrid,
    desc: "Floor plans, table status, and turn times in real time.",
  },
  {
    id: "kitchen",
    title: "Kitchen Display",
    icon: UtensilsCrossed,
    desc: "Ticket queue built for real service pressure and station routing.",
  },
  {
    id: "dine-in",
    title: "Dine-In Orders",
    icon: Store,
    desc: "Table service orders from seat to kitchen without manual handoffs.",
  },
  {
    id: "takeaway",
    title: "Takeaway Orders",
    icon: ShoppingBag,
    desc: "Counter pickup flow with accurate prep times and notifications.",
  },
  {
    id: "delivery",
    title: "Delivery Management",
    icon: Truck,
    desc: "Route delivery tickets alongside dine-in and takeaway in one queue.",
  },
  {
    id: "inventory",
    title: "Inventory",
    icon: Package,
    desc: "Stock, suppliers, purchase orders, and cost control unified.",
  },
  {
    id: "crm",
    title: "CRM",
    icon: Users,
    desc: "Guest profiles, visit history, and next best action in one record.",
  },
  {
    id: "loyalty",
    title: "Loyalty",
    icon: Gift,
    desc: "Points, tiers, and rewards tied to every visit automatically.",
  },
  {
    id: "staff",
    title: "Staff Management",
    icon: Users,
    desc: "Roles, rosters, permissions, and people operations that stay auditable.",
  },
  {
    id: "analytics",
    title: "Analytics",
    icon: BarChart3,
    desc: "Live dashboards for sales, product, staff, and operational health.",
  },
  {
    id: "ai",
    title: "AI Automation",
    icon: Sparkles,
    desc: "Domain agents for ops, finance, marketing, and executive briefings.",
  },
  {
    id: "marketing",
    title: "Marketing",
    icon: Megaphone,
    desc: "Campaigns, segments, and messaging grounded in live customer data.",
  },
  {
    id: "reports",
    title: "Reports",
    icon: Database,
    desc: "Executive clarity—P&L, labour, inventory, and branch comparisons.",
  },
  {
    id: "multi-branch",
    title: "Multi-Branch Management",
    icon: Globe,
    desc: "Scale from one site to a national group with branch-scoped control.",
  },
] as const;

const DEEP_DIVES = [
  {
    id: "pos",
    eyebrow: "Point of Sale",
    title: "Checkout that keeps pace with service.",
    desc: "Busal POS is native to the operating system—not a bolt-on. Every sale updates inventory, CRM, kitchen, and finance instantly.",
    benefits: [
      "Split bills, tips, and multiple payment methods",
      "Orders route to kitchen without re-entry",
      "Receipts and deposits reconcile automatically",
    ],
    preview: "pos" as const,
    reverse: false,
  },
  {
    id: "kitchen",
    eyebrow: "Kitchen Display",
    title: "One queue for every order channel.",
    desc: "Dine-in, takeaway, delivery, and QR orders land in a single kitchen view—prioritised by station and service time.",
    benefits: [
      "Station-based routing for grill, cold, and bar",
      "Live ticket times and bottleneck alerts",
      "Bump screens that sync back to POS and CRM",
    ],
    preview: "kitchen" as const,
    reverse: true,
  },
  {
    id: "crm",
    eyebrow: "CRM & Loyalty",
    title: "Know every customer—not just the last visit.",
    desc: "Guest profiles follow orders, reservations, loyalty, and marketing—so your team always has context at the table or counter.",
    benefits: [
      "Visit history and preferences on every cover",
      "Loyalty tiers applied without manual entry",
      "Campaigns targeted by real behaviour, not exports",
    ],
    preview: "crm" as const,
    reverse: false,
  },
  {
    id: "inventory",
    eyebrow: "Inventory",
    title: "Stock that matches what you actually sell.",
    desc: "Sell-through drives replenishment. Purchase orders, low-stock alerts, and supplier continuity live beside your POS—not in a spreadsheet.",
    benefits: [
      "Recipe-level depletion from every ticket",
      "AI-powered reorder suggestions before stockouts",
      "Cost and margin visibility by branch and SKU",
    ],
    preview: "inventory" as const,
    reverse: true,
  },
  {
    id: "ai",
    eyebrow: "AI Automation",
    title: "Intelligence that works during the shift—not after close.",
    desc: "Domain agents read live operational data to surface risks, recommendations, and automations your managers can approve in seconds.",
    benefits: [
      "Morning briefings before doors open",
      "Demand and staffing signals during service",
      "Automations with human approval gates",
    ],
    preview: "ai" as const,
    reverse: false,
  },
  {
    id: "analytics",
    eyebrow: "Analytics & Reports",
    title: "Dashboards that tell you what changed—and why.",
    desc: "Visual analytics plus narrative insights so owners and managers act on signal, not spreadsheet archaeology.",
    benefits: [
      "Branch, product, and staff performance in one view",
      "Export-ready reports for finance and investors",
      "AI explanations on top of live metrics",
    ],
    preview: "analytics" as const,
    reverse: true,
  },
] as const;

const LOVE = [
  {
    icon: Clock,
    metric: "10k+",
    title: "Hours saved monthly",
    desc: "Operators automate reporting, reordering, and guest follow-ups across the platform.",
  },
  {
    icon: TrendingUp,
    metric: "+18%",
    title: "Revenue growth",
    desc: "Upsells, loyalty, and AI recommendations compound on connected order and CRM data.",
  },
  {
    icon: Workflow,
    metric: "40+",
    title: "Native automations",
    desc: "Workflows span POS, kitchen, inventory, and marketing without Zapier glue.",
  },
  {
    icon: Layers,
    metric: "1",
    title: "Centralized operations",
    desc: "Every module shares customers, stock, permissions, and audit trails by design.",
  },
] as const;

const COMPARE_ROWS = [
  ["Modules", "Separate apps per function", "18+ native modules, one spine"],
  ["Data sync", "Manual exports and imports", "Live shared data model"],
  ["Kitchen & POS", "Integrations that break", "One order truth end-to-end"],
  ["AI", "Generic chat, no context", "Agents on live operational data"],
  ["Multi-branch", "Expensive add-ons", "Built in from day one"],
  ["Implementation", "Login email and PDF", "Structured discovery to go-live"],
] as const;

const ENTERPRISE = [
  {
    icon: Shield,
    title: "Security",
    desc: "Encrypted data, hardened headers, tenant isolation, and continuous monitoring.",
  },
  {
    icon: KeyRound,
    title: "Role Permissions",
    desc: "Branch-scoped access by responsibility—managers, floor, kitchen, finance.",
  },
  {
    icon: Cloud,
    title: "Cloud",
    desc: "Always-on infrastructure with redundancy and zero server maintenance.",
  },
  {
    icon: Zap,
    title: "API",
    desc: "Integrate payments, accounting, identity, and custom workflows via API.",
  },
  {
    icon: Server,
    title: "Multi-Tenant",
    desc: "Isolated business data with platform governance for groups and franchises.",
  },
  {
    icon: Globe,
    title: "Scalability",
    desc: "From first location to enterprise group without re-platforming.",
  },
] as const;

export function FeaturesPage() {
  return (
    <div className="feat">
      {/* Hero */}
      <section className="feat-hero">
        <div className="feat-hero__glow" />
        <div className="home-container">
          <div className="feat-hero__grid">
            <div>
              <FadeIn delay={0.04}>
                <span className="home-hero__badge">
                  <Sparkles className="h-3.5 w-3.5 text-[#8B5CF6]" aria-hidden="true" />
                  Features
                </span>
              </FadeIn>
              <FadeIn delay={0.1}>
                <h1 className="feat-hero__headline">
                  Everything Your Business Needs.
                  <br />
                  <span className="feat-hero__accent">One Intelligent Platform.</span>
                </h1>
              </FadeIn>
              <FadeIn delay={0.18}>
                <p className="home-hero__desc">
                  From POS and kitchen to CRM, inventory, AI, and multi-branch control—Busal OS
                  replaces fragmented tools with one operating system your team actually runs on.
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
            </div>
            <FadeIn delay={0.2}>
              <FeaturesHeroDashboard />
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section className="home-section" id="core-features">
        <div className="home-container">
          <Reveal>
            <p className="home-eyebrow">Core Features</p>
            <h2 className="home-title feat-title--wide">What Busal OS actually does.</h2>
            <p className="home-lead">
              Eighteen connected capabilities—from front-of-house to finance—designed as one system,
              not a pile of integrations.
            </p>
          </Reveal>
          <div className="feat-grid">
            {CORE_FEATURES.map((feature, i) => (
              <Reveal key={feature.id} delay={i * 0.02}>
                <article className="feat-card">
                  <span className="feat-card__icon" aria-hidden="true">
                    <feature.icon className="h-5 w-5" />
                  </span>
                  <h3 className="feat-card__title">{feature.title}</h3>
                  <p className="feat-card__desc">{feature.desc}</p>
                  <div className="feat-card__preview" aria-hidden="true">
                    <div className="feat-card__preview-bar" />
                    <div className="feat-card__preview-bar" />
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Workflow */}
      <section className="home-section home-section--tight">
        <div className="home-container">
          <Reveal>
            <p className="home-eyebrow">Connected Workflow</p>
            <h2 className="home-title">One journey. Every module.</h2>
            <p className="home-lead">
              From the first guest action to AI-powered recommendations—no manual handoffs between
              systems.
            </p>
          </Reveal>
          <Reveal delay={0.06}>
            <FeaturesWorkflow />
          </Reveal>
        </div>
      </section>

      {/* Feature Deep Dive */}
      <section className="home-section">
        <div className="home-container">
          <Reveal>
            <p className="home-eyebrow">Feature Deep Dive</p>
            <h2 className="home-title feat-title--wide">See how the platform works in practice.</h2>
            <p className="home-lead">
              Native modules with real UI—not slide decks. Each capability connects to the next
              without export tax.
            </p>
          </Reveal>
          <div className="feat-dive">
            {DEEP_DIVES.map((block, i) => (
              <Reveal key={block.id} delay={i * 0.04}>
                <div
                  className={cn("feat-dive__block", block.reverse && "feat-dive__block--reverse")}
                >
                  <div className="feat-dive__content">
                    <p className="feat-dive__eyebrow">{block.eyebrow}</p>
                    <h3 className="feat-dive__title">{block.title}</h3>
                    <p className="feat-dive__desc">{block.desc}</p>
                    <ul className="feat-dive__benefits">
                      {block.benefits.map((benefit) => (
                        <li key={benefit}>{benefit}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="feat-dive__visual">
                    <FeatureUiPreview variant={block.preview} />
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Why Businesses Love Busal */}
      <section className="home-section home-section--tight">
        <div className="home-container">
          <Reveal>
            <p className="home-eyebrow">Why Businesses Love Busal</p>
            <h2 className="home-title">Outcomes operators measure—not vanity metrics.</h2>
            <p className="home-lead">
              Time back, revenue up, operations centralized, and automation that compounds every
              week.
            </p>
          </Reveal>
          <div className="feat-love">
            {LOVE.map((item, i) => (
              <Reveal key={item.title} delay={i * 0.04}>
                <article className="feat-love__card">
                  <item.icon className="h-6 w-6" aria-hidden="true" />
                  <span className="feat-love__metric">{item.metric}</span>
                  <strong className="feat-love__title">{item.title}</strong>
                  <span className="feat-love__desc">{item.desc}</span>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="home-section">
        <div className="home-container">
          <Reveal>
            <p className="home-eyebrow">Comparison</p>
            <h2 className="home-title">Traditional tools vs Busal OS.</h2>
            <p className="home-lead">
              The difference isn&apos;t feature count—it&apos;s whether your stack shares one
              operating rhythm.
            </p>
          </Reveal>
          <Reveal delay={0.06}>
            <div className="feat-compare">
              <div className="feat-compare__head">
                <span>Capability</span>
                <span>Traditional tools</span>
                <span>Busal OS</span>
              </div>
              {COMPARE_ROWS.map(([cap, trad, busal]) => (
                <div key={cap} className="feat-compare__row">
                  <span>{cap}</span>
                  <span>{trad}</span>
                  <span>{busal}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Enterprise Features */}
      <section className="home-section home-section--tight">
        <div className="home-container">
          <Reveal>
            <p className="home-eyebrow">Enterprise Features</p>
            <h2 className="home-title">Built for scale from day one.</h2>
            <p className="home-lead">
              Security, permissions, cloud reliability, and API access—without the enterprise sales
              cycle before you can go live.
            </p>
          </Reveal>
          <div className="feat-enterprise">
            {ENTERPRISE.map((item, i) => (
              <Reveal key={item.title} delay={i * 0.03}>
                <article className="feat-enterprise__card">
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
      <section className="feat-cta" aria-labelledby="feat-cta-title">
        <div className="home-container">
          <Reveal>
            <div className="feat-cta__panel">
              <div className="feat-cta__glow feat-cta__glow--a" aria-hidden="true" />
              <div className="feat-cta__glow feat-cta__glow--b" aria-hidden="true" />
              <p className="home-eyebrow" style={{ position: "relative" }}>
                Get started
              </p>
              <h2 id="feat-cta-title" className="feat-cta__title">
                Ready to transform your business?
              </h2>
              <p className="feat-cta__lead">
                Start free today or book a demo—we&apos;ll map Busal features to your exact
                operation.
              </p>
              <div className="feat-cta__actions">
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

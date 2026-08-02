"use client";

import {
  BarChart3,
  Brain,
  Headphones,
  LineChart,
  Lock,
  Megaphone,
  Package,
  PieChart,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  UtensilsCrossed,
  Wallet,
  Workflow,
  Zap,
} from "lucide-react";
import Link from "next/link";

import { ROUTES } from "@/constants/routes";
import { FadeIn, Reveal } from "@/modules/marketing/components/home/home-motion";
import { AiHeroViz, AiWorkflowViz } from "@/modules/marketing/components/ai/ai-visuals";
import { MARKETING_ROUTES } from "@/modules/marketing/constants/routes";

import "@/modules/marketing/components/home/home.css";
import "./ai.css";

const AI_TEAM = [
  {
    icon: Brain,
    title: "AI Manager",
    features: ["Business insights", "Revenue recommendations", "Performance reports"],
    preview: [
      ["Morning briefing", "Ready"],
      ["Revenue vs target", "+8.2%"],
      ["Staff utilisation", "Optimal"],
    ],
  },
  {
    icon: Headphones,
    title: "AI Receptionist",
    features: ["Bookings", "Calls", "Customer queries"],
    preview: [
      ["Table for 4 · 7pm", "Confirmed"],
      ["Missed call follow-up", "Sent"],
      ["Guest FAQ", "Resolved"],
    ],
  },
  {
    icon: UtensilsCrossed,
    title: "AI Waiter",
    features: ["Order recommendations", "Upselling", "Menu suggestions"],
    preview: [
      ["Wine pairing", "Suggested"],
      ["Dessert upsell", "+£4.20"],
      ["Allergy check", "Clear"],
    ],
  },
  {
    icon: Megaphone,
    title: "AI Marketing",
    features: ["Campaigns", "Promotions", "Loyalty"],
    preview: [
      ["Weekday lunch promo", "Live"],
      ["VIP segment", "214 guests"],
      ["Campaign ROI", "+22%"],
    ],
  },
  {
    icon: Package,
    title: "AI Inventory",
    features: ["Stock prediction", "Supplier recommendations", "Waste reduction"],
    preview: [
      ["Salmon forecast", "Order Thu"],
      ["Low stock alert", "3 items"],
      ["Waste trend", "-14%"],
    ],
  },
  {
    icon: Wallet,
    title: "AI Finance",
    features: ["Expenses", "Profit", "Forecasting"],
    preview: [
      ["Cashflow forecast", "Healthy"],
      ["Cost anomaly", "Flagged"],
      ["Margin by branch", "Updated"],
    ],
  },
] as const;

const EXAMPLES = [
  {
    industry: "Restaurant",
    problem: "Managers spend hours reconciling covers, kitchen delays, and margin blind spots.",
    solution:
      "AI Manager briefs the team before service, AI Waiter drives attach rate, and AI Inventory prevents stockouts on busy nights.",
    metric: "38% faster ticket times",
  },
  {
    industry: "Retail",
    problem: "Promotions misfire and stockouts happen because sell-through data arrives too late.",
    solution:
      "AI Marketing segments high-value shoppers while AI Inventory predicts replenishment from live basket data.",
    metric: "22% fewer stockouts",
  },
  {
    industry: "Clinic",
    problem: "Front desk chases confirmations and follow-ups across disconnected systems.",
    solution:
      "AI Receptionist handles booking queries, reminders, and patient FAQs—freeing staff for in-person care.",
    metric: "2.1× faster front-desk flow",
  },
  {
    industry: "Hotel",
    problem: "Guest preferences get lost between reservations, housekeeping, and F&B.",
    solution:
      "Busal AI connects guest profiles across modules so every touchpoint feels personal and proactive.",
    metric: "Higher guest satisfaction",
  },
  {
    industry: "Salon",
    problem: "Chair utilisation and retail attach are invisible until month-end.",
    solution:
      "AI Manager surfaces peak-hour gaps while AI Marketing nudges clients toward rebooking and retail add-ons.",
    metric: "Stronger repeat visits",
  },
] as const;

const CAPABILITIES = [
  {
    icon: BarChart3,
    title: "Predictive Analytics",
    desc: "Spot trends before they show up in weekly reports.",
  },
  {
    icon: TrendingUp,
    title: "Sales Forecasting",
    desc: "Project revenue by day, branch, and channel with confidence.",
  },
  {
    icon: PieChart,
    title: "Demand Forecasting",
    desc: "Anticipate covers, footfall, and product demand automatically.",
  },
  {
    icon: Users,
    title: "Smart Staffing",
    desc: "Align rosters to predicted demand—not guesswork.",
  },
  {
    icon: Target,
    title: "Customer Segmentation",
    desc: "Group guests by behaviour, value, and visit patterns.",
  },
  {
    icon: Megaphone,
    title: "Marketing Automation",
    desc: "Launch campaigns grounded in live CRM and order data.",
  },
  {
    icon: Package,
    title: "Inventory Prediction",
    desc: "Order the right stock at the right time, every time.",
  },
  {
    icon: LineChart,
    title: "Business Insights",
    desc: "Narrative intelligence on top of dashboards your team already uses.",
  },
] as const;

const COMPARE_ROWS = [
  ["Daily operations", "Manual checks and exports", "AI agents on live modules"],
  ["Decision speed", "Wait for weekly reports", "Real-time recommendations"],
  ["Automation", "Zapier glue between tools", "Native workflows across Busal"],
  ["Learning", "Static rules and templates", "Context that improves with your data"],
  ["Cost of ownership", "Multiple AI subscriptions", "One AI layer in your OS"],
] as const;

const SECURITY = [
  {
    icon: Lock,
    title: "Private by default",
    desc: "Customer data stays within your tenant—never shared across businesses.",
  },
  {
    icon: ShieldCheck,
    title: "Role-based permissions",
    desc: "AI respects the same access controls as your team. Sensitive data stays scoped.",
  },
  {
    icon: Zap,
    title: "Encrypted processing",
    desc: "Data protected in transit and at rest with modern encryption standards.",
  },
  {
    icon: Workflow,
    title: "Enterprise security",
    desc: "Tenant isolation, audit trails, and production-grade infrastructure.",
  },
] as const;

const ROADMAP = [
  {
    phase: "Next",
    title: "Voice AI",
    desc: "Hands-free briefings and floor copilots for managers during service.",
  },
  {
    phase: "Next",
    title: "Vision AI",
    desc: "Visual intelligence for inventory, quality checks, and operational awareness.",
  },
  {
    phase: "Soon",
    title: "Autonomous Agents",
    desc: "Agents that propose and execute multi-step workflows with human approval.",
  },
  {
    phase: "Soon",
    title: "Predictive Operations",
    desc: "Anticipate demand, staffing, and supply before pressure hits.",
  },
  {
    phase: "Vision",
    title: "Multi-Agent Collaboration",
    desc: "Specialist agents working together across sales, ops, finance, and support.",
  },
] as const;

export function AiPage() {
  return (
    <div className="ai">
      {/* Hero */}
      <section className="ai-hero">
        <div className="ai-hero__glow" />
        <div className="home-container">
          <div className="ai-hero__grid">
            <div>
              <FadeIn delay={0.04}>
                <span className="home-hero__badge">
                  <Sparkles className="h-3.5 w-3.5 text-[#A78BFA]" aria-hidden="true" />
                  AI Operating System
                </span>
              </FadeIn>
              <FadeIn delay={0.1}>
                <h1 className="ai-hero__headline">
                  Meet the AI Workforce
                  <br />
                  Behind Your Business.
                </h1>
              </FadeIn>
              <FadeIn delay={0.18}>
                <p className="home-hero__desc">
                  Busal AI automates daily operations—bookings, orders, inventory, marketing, and
                  finance—while helping owners make faster, smarter decisions. Not a chatbot bolted
                  on. Intelligence built into how your business actually runs.
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
              <AiHeroViz />
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Meet Your AI Team */}
      <section className="home-section">
        <div className="home-container">
          <Reveal>
            <p className="home-eyebrow">Meet Your AI Team</p>
            <h2 className="home-title ai-title--wide">
              Specialists for every part of your operation.
            </h2>
            <p className="home-lead">
              Six AI roles that save time, cut costs, and drive revenue—from the first booking to
              the final forecast.
            </p>
          </Reveal>
          <div className="ai-team">
            {AI_TEAM.map((agent, i) => (
              <Reveal key={agent.title} delay={i * 0.04}>
                <article className="ai-agent">
                  <span className="ai-agent__icon" aria-hidden="true">
                    <agent.icon className="h-6 w-6" />
                  </span>
                  <h3 className="ai-agent__title">{agent.title}</h3>
                  <ul className="ai-agent__list">
                    {agent.features.map((feature) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>
                  <div className="ai-agent__preview" aria-hidden="true">
                    {agent.preview.map(([label, value]) => (
                      <div key={label} className="ai-agent__preview-row">
                        <span className="ai-agent__preview-dot" />
                        <span>{label}</span>
                        <strong>{value}</strong>
                      </div>
                    ))}
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* How AI Works */}
      <section className="home-section home-section--tight">
        <div className="home-container">
          <Reveal>
            <p className="home-eyebrow">How AI Works</p>
            <h2 className="home-title">From customer action to intelligent recommendation.</h2>
            <p className="home-lead">
              Every signal flows through Busal AI—connected to your modules, automations, and
              insights—so recommendations arrive with context, not guesswork.
            </p>
          </Reveal>
          <Reveal delay={0.06}>
            <AiWorkflowViz />
          </Reveal>
        </div>
      </section>

      {/* Real Business Examples */}
      <section className="home-section">
        <div className="home-container">
          <Reveal>
            <p className="home-eyebrow">Real Business Examples</p>
            <h2 className="home-title ai-title--wide">
              AI that solves problems you face every day.
            </h2>
            <p className="home-lead">
              Whether you run a restaurant, retail store, clinic, hotel, or salon—Busal AI is built
              for the rhythms of real operations.
            </p>
          </Reveal>
          <div className="ai-examples">
            {EXAMPLES.map((ex, i) => (
              <Reveal key={ex.industry} delay={i * 0.04}>
                <article className="ai-example">
                  <span className="ai-example__industry">{ex.industry}</span>
                  <p className="ai-example__problem">{ex.problem}</p>
                  <p className="ai-example__solution">{ex.solution}</p>
                  <span className="ai-example__metric">{ex.metric}</span>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* AI Capabilities */}
      <section className="home-section home-section--tight">
        <div className="home-container">
          <Reveal>
            <p className="home-eyebrow">AI Capabilities</p>
            <h2 className="home-title">Intelligence that compounds over time.</h2>
            <p className="home-lead">
              Predictive analytics, forecasting, segmentation, and automation—powered by the same
              data your team uses every day.
            </p>
          </Reveal>
          <div className="ai-caps">
            {CAPABILITIES.map((cap, i) => (
              <Reveal key={cap.title} delay={i * 0.03}>
                <article className="ai-cap">
                  <cap.icon className="h-5 w-5" aria-hidden="true" />
                  <strong>{cap.title}</strong>
                  <span>{cap.desc}</span>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Why Busal AI */}
      <section className="home-section">
        <div className="home-container">
          <Reveal>
            <p className="home-eyebrow">Why Busal AI</p>
            <h2 className="home-title">Traditional software vs Busal AI.</h2>
            <p className="home-lead">
              Generic tools add dashboards. Busal adds a workforce—automation, intelligence,
              recommendations, and learning built into your operating system.
            </p>
          </Reveal>
          <Reveal delay={0.06}>
            <div className="ai-compare">
              <div className="ai-compare__head">
                <span>Capability</span>
                <span>Traditional software</span>
                <span>Busal AI</span>
              </div>
              {COMPARE_ROWS.map(([cap, trad, busal]) => (
                <div key={cap} className="ai-compare__row">
                  <span>{cap}</span>
                  <span>{trad}</span>
                  <span>{busal}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Security */}
      <section className="home-section home-section--tight">
        <div className="home-container">
          <Reveal>
            <p className="home-eyebrow">Security & Privacy</p>
            <h2 className="home-title">Your data stays yours.</h2>
            <p className="home-lead">
              Customer data remains private within your business. AI operates inside your permission
              model—with encryption and enterprise-grade security at every layer.
            </p>
          </Reveal>
          <div className="ai-security">
            {SECURITY.map((item, i) => (
              <Reveal key={item.title} delay={i * 0.04}>
                <article className="ai-security__card">
                  <item.icon className="h-6 w-6" aria-hidden="true" />
                  <strong>{item.title}</strong>
                  <p>{item.desc}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Future AI Vision */}
      <section className="home-section">
        <div className="home-container">
          <Reveal>
            <p className="home-eyebrow">Future AI Vision</p>
            <h2 className="home-title ai-title--wide">The roadmap ahead.</h2>
            <p className="home-lead">
              Voice, vision, autonomous agents, and multi-agent collaboration—always behind
              permission boundaries and tenant isolation.
            </p>
          </Reveal>
          <div className="ai-roadmap">
            {ROADMAP.map((item, i) => (
              <Reveal key={item.title} delay={i * 0.04}>
                <article className="ai-roadmap__item">
                  <p className="ai-roadmap__phase">{item.phase}</p>
                  <h3 className="ai-roadmap__title">{item.title}</h3>
                  <p className="ai-roadmap__desc">{item.desc}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="ai-cta" aria-labelledby="ai-cta-title">
        <div className="home-container">
          <Reveal>
            <div className="ai-cta__panel">
              <div className="ai-cta__glow ai-cta__glow--a" aria-hidden="true" />
              <div className="ai-cta__glow ai-cta__glow--b" aria-hidden="true" />
              <p className="home-eyebrow" style={{ position: "relative" }}>
                Get started
              </p>
              <h2 id="ai-cta-title" className="ai-cta__title">
                Ready to add an AI workforce to your business?
              </h2>
              <p className="ai-cta__lead">
                Book a demo to see AI agents working on your operations—or start free and explore
                the platform today.
              </p>
              <div className="ai-cta__actions">
                <Link href={MARKETING_ROUTES.bookDemo} className="home-btn home-btn--primary">
                  Book Demo
                </Link>
                <Link href={ROUTES.signup} className="home-btn home-btn--secondary">
                  Start Free
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}

"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, BarChart3, Bot, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { Reveal } from "@/modules/marketing/components/home/home-motion";
import { MARKETING_ROUTES } from "@/modules/marketing/constants/routes";

const FEATURES = [
  {
    id: "command",
    eyebrow: "Multi-location control",
    title: "One command center for every location",
    summary:
      "Switch branches in seconds, compare live revenue, and spot exceptions before they become service incidents—without exporting three systems into a Friday spreadsheet.",
    points: ["Live branch switching", "Role-aware dashboards", "Exception alerts"],
    icon: BarChart3,
    cta: "Explore platform",
    href: MARKETING_ROUTES.platform,
  },
  {
    id: "ai",
    eyebrow: "Domain intelligence",
    title: "AI that understands service pressure",
    summary:
      "Morning briefings read kitchen tickets, loyalty tiers, and cashflow signals—so managers act on decisions, not another dashboard to decode.",
    points: ["Cross-module context", "Actionable recommendations", "Human approval paths"],
    icon: Bot,
    cta: "See AI platform",
    href: MARKETING_ROUTES.ai,
  },
  {
    id: "reliability",
    eyebrow: "Operational resilience",
    title: "Built for teams who cannot afford downtime",
    summary:
      "From first seating to close, orders, guests, and finance stay aligned so the floor stays calm when demand spikes.",
    points: ["Offline-resilient flows", "Audit-ready history", "Fast onboarding"],
    icon: ShieldCheck,
    cta: "View features",
    href: MARKETING_ROUTES.features,
  },
] as const;

function CommandCenterScreenshot() {
  const reduced = useReducedMotion();
  return (
    <div className="home-screenshot home-screenshot--command">
      <div className="home-screenshot__chrome">
        <span />
        <span />
        <span />
        <p>Busal OS · Command Center</p>
      </div>
      <div className="home-screenshot__body">
        <div className="home-screenshot__tabs">
          {["Soho", "Shoreditch", "Canary Wharf"].map((branch, i) => (
            <span key={branch} className={i === 0 ? "is-active" : undefined}>
              {branch}
            </span>
          ))}
        </div>
        <div className="home-screenshot__kpis">
          {[
            ["Revenue", "£18.2k", "+14%"],
            ["Covers", "412", "+8%"],
            ["Ticket time", "9.4m", "-12%"],
          ].map(([label, value, delta]) => (
            <div key={label} className="home-screenshot__kpi">
              <p>{label}</p>
              <strong>{value}</strong>
              <span>{delta}</span>
            </div>
          ))}
        </div>
        <div className="home-screenshot__split">
          <div className="home-screenshot__panel">
            <p className="home-screenshot__panel-title">Live queue</p>
            {["Table 12 · mains", "Bar 3 · drinks", "Patio 7 · dessert"].map((row) => (
              <div key={row} className="home-screenshot__row">
                {row}
              </div>
            ))}
          </div>
          <div className="home-screenshot__panel">
            <p className="home-screenshot__panel-title">Weekly revenue</p>
            <div className="home-screenshot__bars">
              {[42, 58, 48, 72, 64, 88, 76, 92, 68, 84, 78, 95].map((h, i) => (
                <motion.div
                  key={i}
                  className="home-screenshot__bar"
                  initial={reduced ? false : { height: 0 }}
                  whileInView={{ height: `${h}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.03 }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AiBriefingScreenshot() {
  return (
    <div className="home-screenshot home-screenshot--ai">
      <div className="home-screenshot__chrome">
        <span />
        <span />
        <span />
        <p>AI Operations Brief · 07:30</p>
      </div>
      <div className="home-screenshot__body home-screenshot__body--ai">
        <div className="home-screenshot__ai-header">
          <span className="home-screenshot__ai-avatar">AI</span>
          <div>
            <p className="home-screenshot__ai-name">Operations Agent</p>
            <p className="home-screenshot__ai-meta">Cross-module briefing ready</p>
          </div>
        </div>
        <div className="home-screenshot__ai-card home-screenshot__ai-card--primary">
          Cover velocity is up 14% vs last Friday. Recommend opening a second seating window at
          19:30.
        </div>
        <div className="home-screenshot__ai-card">
          3 VIP reservations arriving within 40 minutes. Loyalty tier upgrades pending for 24
          guests.
        </div>
        <div className="home-screenshot__ai-actions">
          <span>Approve staffing suggestion</span>
          <span>View kitchen load</span>
        </div>
        <div className="home-screenshot__ai-metrics">
          {[
            ["Kitchen load", "Moderate"],
            ["Cashflow", "On track"],
            ["Labour", "Within target"],
          ].map(([k, v]) => (
            <div key={k}>
              <p>{k}</p>
              <strong>{v}</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ReliabilityScreenshot() {
  return (
    <div className="home-screenshot home-screenshot--reliability">
      <div className="home-screenshot__chrome">
        <span />
        <span />
        <span />
        <p>Service timeline · Friday rush</p>
      </div>
      <div className="home-screenshot__body">
        <div className="home-screenshot__timeline">
          {[
            ["18:00", "Pre-rush prep complete", "done"],
            ["18:45", "QR orders synced to kitchen", "done"],
            ["19:20", "Demand spike detected", "active"],
            ["19:35", "Finance deposit reconciled", "pending"],
          ].map(([time, label, status]) => (
            <div key={time} className={`home-screenshot__timeline-item is-${status}`}>
              <span>{time}</span>
              <div>
                <p>{label}</p>
                <small>
                  {status === "done" ? "Synced" : status === "active" ? "Live" : "Queued"}
                </small>
              </div>
            </div>
          ))}
        </div>
        <div className="home-screenshot__status-grid">
          {[
            ["Orders", "286 synced"],
            ["Guests", "1,042 tracked"],
            ["Audit", "100% logged"],
          ].map(([k, v]) => (
            <div key={k} className="home-screenshot__status">
              <p>{k}</p>
              <strong>{v}</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const SCREENSHOTS = {
  command: CommandCenterScreenshot,
  ai: AiBriefingScreenshot,
  reliability: ReliabilityScreenshot,
} as const;

export function HomeFeatureShowcase() {
  return (
    <section className="home-section home-features" aria-labelledby="home-features-title">
      <div className="home-container">
        <Reveal>
          <p className="home-eyebrow">Features</p>
          <h2 id="home-features-title" className="home-title home-title--wide">
            Product depth you can feel in the first week.
          </h2>
          <p className="home-lead">
            Three moments from the Busal operating system—each built for how teams actually run
            service, growth, and finance.
          </p>
        </Reveal>

        <div className="home-features__list">
          {FEATURES.map((feature, index) => {
            const Screenshot = SCREENSHOTS[feature.id];
            const reverse = index % 2 === 1;

            return (
              <Reveal key={feature.id} delay={0.05}>
                <article
                  className={`home-features__row${reverse ? "home-features__row--reverse" : ""}`}
                >
                  <div className="home-features__copy">
                    <span className="home-features__icon" aria-hidden="true">
                      <feature.icon className="h-5 w-5" />
                    </span>
                    <p className="home-features__eyebrow">{feature.eyebrow}</p>
                    <h3 className="home-features__title">{feature.title}</h3>
                    <p className="home-features__summary">{feature.summary}</p>
                    <ul className="home-features__points">
                      {feature.points.map((point) => (
                        <li key={point}>{point}</li>
                      ))}
                    </ul>
                    <Link href={feature.href} className="home-features__link">
                      {feature.cta}
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </div>
                  <div className="home-features__visual">
                    <Screenshot />
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

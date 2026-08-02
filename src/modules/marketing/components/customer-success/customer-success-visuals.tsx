"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Sparkles, TrendingUp } from "lucide-react";

const ease = [0.22, 1, 0.36, 1] as const;

const METRICS = [
  { label: "Revenue", value: "+35%", trend: "vs prior year" },
  { label: "Orders today", value: "286", trend: "+12%" },
  { label: "Hours saved", value: "18/wk", trend: "per location" },
] as const;

const AI_INSIGHTS = [
  "Reorder salmon before Friday — demand up 14%",
  "VIP cover at 7:30pm — prep loyalty offer",
  "Staff utilisation optimal for evening service",
] as const;

const BARS = [48, 62, 55, 78, 68, 88, 74, 92, 82, 96, 88, 100];

export function SuccessHeroViz() {
  const reduced = useReducedMotion();

  return (
    <div className="cs-viz" aria-hidden="true">
      <div className="cs-viz__glow" />
      <motion.div
        className="cs-viz__shell"
        initial={reduced ? false : { opacity: 0, y: 18, scale: 0.985 }}
        animate={reduced ? undefined : { opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, delay: 0.15, ease }}
      >
        <div className="cs-viz__head">
          <p>Success Command Center</p>
          <span className="cs-viz__live">Live</span>
        </div>

        <div className="cs-viz__metrics">
          {METRICS.map((m, i) => (
            <motion.div
              key={m.label}
              className="cs-viz__metric"
              initial={reduced ? false : { opacity: 0, y: 8 }}
              animate={reduced ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 + i * 0.06, ease }}
            >
              <TrendingUp className="h-3.5 w-3.5 text-[#34d399]" />
              <strong>{m.value}</strong>
              <p>{m.label}</p>
              <span>{m.trend}</span>
            </motion.div>
          ))}
        </div>

        <div className="cs-viz__chart">
          <p>Growth · 12 months</p>
          <div className="cs-viz__bars">
            {BARS.map((h, i) =>
              reduced ? (
                <div key={i} className="cs-viz__bar" style={{ height: `${h}%` }} />
              ) : (
                <motion.div
                  key={i}
                  className="cs-viz__bar"
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  transition={{ duration: 0.65, delay: 0.4 + i * 0.03, ease }}
                />
              ),
            )}
          </div>
        </div>

        <div className="cs-viz__ai">
          <div className="cs-viz__ai-head">
            <Sparkles className="h-3.5 w-3.5 text-[#8B5CF6]" />
            <p>AI insights</p>
          </div>
          <ul>
            {AI_INSIGHTS.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      </motion.div>
    </div>
  );
}

export function SuccessGrowthDashboard() {
  const reduced = useReducedMotion();
  const panels = [
    {
      title: "Revenue growth",
      value: "+35%",
      sub: "Year over year",
      bars: [42, 58, 52, 70, 64, 82, 76, 90],
    },
    {
      title: "Customer retention",
      value: "89%",
      sub: "Repeat visit rate",
      bars: [65, 72, 68, 78, 82, 85, 88, 89],
    },
    {
      title: "Operational efficiency",
      value: "+28%",
      sub: "Throughput index",
      bars: [48, 55, 58, 62, 68, 72, 76, 80],
    },
    {
      title: "Staff productivity",
      value: "+22%",
      sub: "Output per shift",
      bars: [50, 54, 58, 62, 66, 70, 74, 78],
    },
    {
      title: "AI recommendations",
      value: "142",
      sub: "Acted on this month",
      bars: [30, 45, 52, 68, 72, 88, 95, 100],
    },
    {
      title: "Automation usage",
      value: "50+",
      sub: "Daily automations",
      bars: [40, 48, 55, 62, 70, 78, 85, 92],
    },
  ];

  return (
    <div className="cs-dashboard">
      {panels.map((panel, i) => (
        <motion.div
          key={panel.title}
          className="cs-dashboard__panel"
          initial={reduced ? false : { opacity: 0, y: 14 }}
          whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-8% 0px" }}
          transition={{ duration: 0.5, delay: i * 0.05, ease }}
        >
          <p className="cs-dashboard__label">{panel.title}</p>
          <strong className="cs-dashboard__value">{panel.value}</strong>
          <span className="cs-dashboard__sub">{panel.sub}</span>
          <div className="cs-dashboard__bars">
            {panel.bars.map((h, j) => (
              <div key={j} className="cs-dashboard__bar" style={{ height: `${h}%` }} />
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export function SuccessJourneyFlow() {
  const reduced = useReducedMotion();
  const steps = [
    "Book Demo",
    "Business Discovery",
    "Data Migration",
    "Configuration",
    "Staff Training",
    "Go Live",
    "Ongoing Success",
  ];

  return (
    <div className="cs-journey">
      {steps.map((step, i) => (
        <div key={step} className="cs-journey__item">
          {!reduced ? (
            <motion.div
              className="cs-journey__node"
              initial={{ opacity: 0, scale: 0.92 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-8% 0px" }}
              transition={{ duration: 0.45, delay: i * 0.06, ease }}
            >
              <span className="cs-journey__num">{String(i + 1).padStart(2, "0")}</span>
              <span>{step}</span>
            </motion.div>
          ) : (
            <div className="cs-journey__node">
              <span className="cs-journey__num">{String(i + 1).padStart(2, "0")}</span>
              <span>{step}</span>
            </div>
          )}
          {i < steps.length - 1 ? (
            <div className="cs-journey__arrow" aria-hidden="true">
              ↓
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

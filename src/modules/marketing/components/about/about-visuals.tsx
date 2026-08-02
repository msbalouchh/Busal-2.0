"use client";

import { motion, useReducedMotion } from "framer-motion";

const ease = [0.22, 1, 0.36, 1] as const;

const NETWORK_NODES = [
  { id: "n1", x: 22, y: 28 },
  { id: "n2", x: 78, y: 22 },
  { id: "n3", x: 88, y: 55 },
  { id: "n4", x: 72, y: 82 },
  { id: "n5", x: 38, y: 88 },
  { id: "n6", x: 12, y: 58 },
  { id: "n7", x: 48, y: 14 },
  { id: "n8", x: 55, y: 72 },
] as const;

const CENTER = { x: 50, y: 48 };

const TIMELINE = [
  {
    step: "Problem",
    desc: "Operators drowning in disconnected tools, manual reconciliation, and rising subscriptions.",
  },
  {
    step: "Idea",
    desc: "What if one intelligent platform replaced the entire stack—with AI at the core?",
  },
  {
    step: "Busal OS",
    desc: "The first unified operating system for service businesses—POS, CRM, ops, and finance together.",
  },
  {
    step: "AI Platform",
    desc: "Domain AI agents, predictive intelligence, and automation woven into every workflow.",
  },
  {
    step: "Global Expansion",
    desc: "Scaling across industries and continents—one OS for millions of businesses worldwide.",
  },
] as const;

const INDUSTRY_PINS = [
  { label: "Restaurants", x: 28, y: 38 },
  { label: "Retail", x: 62, y: 32 },
  { label: "Healthcare", x: 74, y: 48 },
  { label: "Hospitality", x: 58, y: 58 },
  { label: "Professional Services", x: 34, y: 52 },
  { label: "Logistics", x: 48, y: 42 },
  { label: "Education", x: 42, y: 68 },
] as const;

export function AboutHeroViz() {
  const reduced = useReducedMotion();

  return (
    <div className="ab-viz" aria-hidden="true">
      <div className="ab-viz__glow" />
      <div className="ab-viz__canvas">
        <svg className="ab-viz__svg" viewBox="0 0 100 100" preserveAspectRatio="none">
          {NETWORK_NODES.map((node) => (
            <line
              key={`line-${node.id}`}
              className="ab-viz__line"
              x1={node.x}
              y1={node.y}
              x2={CENTER.x}
              y2={CENTER.y}
            />
          ))}
          {!reduced
            ? NETWORK_NODES.map((node, i) => (
                <motion.circle
                  key={`pulse-${node.id}`}
                  className="ab-viz__pulse"
                  r="0.45"
                  initial={{ cx: node.x, cy: node.y, opacity: 0.25 }}
                  animate={{
                    cx: [node.x, CENTER.x, node.x],
                    cy: [node.y, CENTER.y, node.y],
                    opacity: [0.25, 0.95, 0.25],
                  }}
                  transition={{
                    duration: 3.6,
                    delay: i * 0.22,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              ))
            : null}
        </svg>

        {NETWORK_NODES.map((node) => (
          <div
            key={node.id}
            className="ab-viz__node"
            style={{ left: `${node.x}%`, top: `${node.y}%` }}
          >
            <div className="ab-viz__node-dot" />
          </div>
        ))}

        <div
          className="ab-viz__node ab-viz__node--core"
          style={{ left: `${CENTER.x}%`, top: `${CENTER.y}%` }}
        >
          <div className="ab-viz__node-core">B</div>
          <span className="ab-viz__node-label">Busal AI</span>
        </div>
      </div>
    </div>
  );
}

export function AboutTimeline() {
  const reduced = useReducedMotion();

  return (
    <div className="ab-timeline">
      {TIMELINE.map((item, i) => (
        <div key={item.step} className="ab-timeline__item">
          {!reduced ? (
            <motion.div
              className="ab-timeline__card"
              initial={{ opacity: 0, x: i % 2 === 0 ? -16 : 16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-6% 0px" }}
              transition={{ duration: 0.5, delay: i * 0.08, ease }}
            >
              <span className="ab-timeline__step">{item.step}</span>
              <p>{item.desc}</p>
            </motion.div>
          ) : (
            <div className="ab-timeline__card">
              <span className="ab-timeline__step">{item.step}</span>
              <p>{item.desc}</p>
            </div>
          )}
          {i < TIMELINE.length - 1 ? (
            <div className="ab-timeline__arrow" aria-hidden="true">
              ↓
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function AboutGlobalViz() {
  const reduced = useReducedMotion();

  return (
    <div className="ab-globe" aria-hidden="true">
      <div className="ab-globe__glow" />
      <div className="ab-globe__canvas">
        <div className="ab-globe__sphere">
          <div className="ab-globe__ring ab-globe__ring--a" />
          <div className="ab-globe__ring ab-globe__ring--b" />
          <div className="ab-globe__ring ab-globe__ring--c" />
          {!reduced ? (
            <motion.div
              className="ab-globe__core"
              animate={{ scale: [1, 1.04, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
          ) : (
            <div className="ab-globe__core" />
          )}
        </div>

        {INDUSTRY_PINS.map((pin, i) =>
          reduced ? (
            <div
              key={pin.label}
              className="ab-globe__pin"
              style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
            >
              <span>{pin.label}</span>
            </div>
          ) : (
            <motion.div
              key={pin.label}
              className="ab-globe__pin"
              style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
              initial={{ opacity: 0, scale: 0.85 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: 0.1 + i * 0.06, ease }}
            >
              <span>{pin.label}</span>
            </motion.div>
          ),
        )}
      </div>
    </div>
  );
}

"use client";

import { motion, useReducedMotion } from "framer-motion";

import { BusalLogoIcon } from "@/components/brand/busal-logo-icon";

const ease = [0.22, 1, 0.36, 1] as const;

const NODES = [
  { id: "pos", label: "POS", x: 18, y: 22 },
  { id: "crm", label: "CRM", x: 82, y: 22 },
  { id: "kitchen", label: "Kitchen", x: 12, y: 52 },
  { id: "ai", label: "AI", x: 88, y: 52 },
  { id: "finance", label: "Finance", x: 22, y: 82 },
  { id: "analytics", label: "Analytics", x: 78, y: 82 },
] as const;

const CENTER = { x: 50, y: 50 };

export function PlatformArchitectureViz() {
  const reduced = useReducedMotion();

  return (
    <div className="platform-arch" aria-hidden="true">
      <div className="platform-arch__glow" />
      <div className="platform-arch__canvas">
        <svg className="platform-arch__svg" viewBox="0 0 100 100" preserveAspectRatio="none">
          {NODES.map((node) => (
            <line
              key={node.id}
              className="platform-arch__line"
              x1={CENTER.x}
              y1={CENTER.y}
              x2={node.x}
              y2={node.y}
            />
          ))}
          {!reduced
            ? NODES.map((node, i) => (
                <motion.circle
                  key={`pulse-${node.id}`}
                  className="platform-arch__pulse"
                  r="0.8"
                  initial={{ cx: CENTER.x, cy: CENTER.y, opacity: 0 }}
                  animate={{
                    cx: [CENTER.x, node.x],
                    cy: [CENTER.y, node.y],
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 2.4,
                    delay: i * 0.35,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
              ))
            : null}
        </svg>

        <div className="platform-arch__node" style={{ left: `${CENTER.x}%`, top: `${CENTER.y}%` }}>
          <div className="platform-arch__node-core platform-arch__node-core--center">
            <BusalLogoIcon className="busal-logo-icon--diagram" aria-hidden />
          </div>
          <span>Busal OS</span>
        </div>

        {NODES.map((node) => (
          <div
            key={node.id}
            className="platform-arch__node"
            style={{ left: `${node.x}%`, top: `${node.y}%` }}
          >
            <div className="platform-arch__node-core">{node.label.slice(0, 2)}</div>
            <span>{node.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PlatformPreviewDashboard() {
  const reduced = useReducedMotion();
  const bars = [42, 58, 48, 72, 64, 88, 76, 92, 68, 84, 78, 95];

  return (
    <div className="platform-preview">
      <div className="platform-preview__chrome">
        <span />
        <span />
        <span />
        <p>Busal OS · Live Platform Preview</p>
      </div>
      <div className="platform-preview__body">
        {[
          ["Analytics", "£124k", "+18%"],
          ["Orders", "2,840", "+12%"],
          ["Staff", "48 active", "On shift"],
          ["AI", "6 agents", "Live"],
          ["CRM", "1,204", "Guests"],
          ["Reservations", "86", "Tonight"],
          ["Revenue", "£18.4k", "+9%"],
        ].map(([label, value, delta]) => (
          <div key={label} className="platform-preview__tile">
            <p>{label}</p>
            <strong>{value}</strong>
            <span>{delta}</span>
          </div>
        ))}
        <div className="platform-preview__chart">
          <p className="text-xs font-semibold tracking-wide text-white/45 uppercase">
            Revenue · 12 weeks
          </p>
          <div className="platform-preview__bars">
            {bars.map((h, i) =>
              reduced ? (
                <div key={i} className="platform-preview__bar" style={{ height: `${h}%` }} />
              ) : (
                <motion.div
                  key={i}
                  className="platform-preview__bar"
                  initial={{ height: 0 }}
                  whileInView={{ height: `${h}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.04, ease }}
                />
              ),
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

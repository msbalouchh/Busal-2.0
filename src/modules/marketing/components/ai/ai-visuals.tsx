"use client";

import { motion, useReducedMotion } from "framer-motion";

import { BusalLogoIcon } from "@/components/brand/busal-logo-icon";

const ease = [0.22, 1, 0.36, 1] as const;

const NODES = [
  { id: "manager", label: "Manager", x: 50, y: 14 },
  { id: "reception", label: "Reception", x: 88, y: 32 },
  { id: "marketing", label: "Marketing", x: 92, y: 68 },
  { id: "finance", label: "Finance", x: 50, y: 88 },
  { id: "inventory", label: "Inventory", x: 8, y: 68 },
  { id: "waiter", label: "Waiter", x: 12, y: 32 },
] as const;

const CENTER = { x: 50, y: 50 };

export function AiHeroViz() {
  const reduced = useReducedMotion();

  return (
    <div className="ai-viz" aria-hidden="true">
      <div className="ai-viz__glow" />
      <div className="ai-viz__canvas">
        <svg className="ai-viz__svg" viewBox="0 0 100 100" preserveAspectRatio="none">
          {NODES.map((node) => (
            <g key={node.id}>
              <line className="ai-viz__line" x1={CENTER.x} y1={CENTER.y} x2={node.x} y2={node.y} />
              <line
                className="ai-viz__line ai-viz__line--dim"
                x1={node.x}
                y1={node.y}
                x2={NODES[(NODES.indexOf(node) + 1) % NODES.length]!.x}
                y2={NODES[(NODES.indexOf(node) + 1) % NODES.length]!.y}
              />
            </g>
          ))}
          {!reduced
            ? NODES.map((node, i) => (
                <motion.circle
                  key={`pulse-${node.id}`}
                  className="ai-viz__pulse"
                  r="0.7"
                  initial={{ cx: CENTER.x, cy: CENTER.y, opacity: 0 }}
                  animate={{
                    cx: [CENTER.x, node.x],
                    cy: [CENTER.y, node.y],
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 2.2,
                    delay: i * 0.3,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
              ))
            : null}
        </svg>

        <div
          className="ai-viz__node ai-viz__node--core"
          style={{ left: `${CENTER.x}%`, top: `${CENTER.y}%` }}
        >
          <div className="ai-viz__node-core ai-viz__node-core--center">
            <BusalLogoIcon className="busal-logo-icon--diagram" aria-hidden />
          </div>
          <span className="ai-viz__node-label">Busal OS</span>
        </div>

        {NODES.map((node) => (
          <div
            key={node.id}
            className="ai-viz__node"
            style={{ left: `${node.x}%`, top: `${node.y}%` }}
          >
            <div className="ai-viz__node-core">{node.label.slice(0, 2)}</div>
            <span className="ai-viz__node-label">{node.label}</span>
          </div>
        ))}

        <div className="ai-viz__dashboard">
          <div className="ai-viz__dashboard-head">
            <span />
            <span />
            <span />
            <p>Live business intelligence</p>
          </div>
          <div className="ai-viz__dashboard-grid">
            {[
              ["Revenue", "+12%"],
              ["Covers", "86"],
              ["Stock", "OK"],
              ["AI Tasks", "14"],
            ].map(([label, value]) => (
              <div key={label} className="ai-viz__dashboard-tile">
                <p>{label}</p>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AiWorkflowViz() {
  const reduced = useReducedMotion();
  const steps = [
    "Customer Action",
    "Busal AI",
    "Business Modules",
    "Automation",
    "Insights",
    "Recommendations",
  ];

  return (
    <div className="ai-flow">
      {steps.map((step, i) => (
        <div key={step} className="ai-flow__item">
          {!reduced ? (
            <motion.div
              className="ai-flow__node"
              initial={{ opacity: 0, scale: 0.92 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-8% 0px" }}
              transition={{ duration: 0.45, delay: i * 0.08, ease }}
            >
              <span>{step}</span>
            </motion.div>
          ) : (
            <div className="ai-flow__node">
              <span>{step}</span>
            </div>
          )}
          {i < steps.length - 1 ? (
            <div className="ai-flow__arrow" aria-hidden="true">
              ↓
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

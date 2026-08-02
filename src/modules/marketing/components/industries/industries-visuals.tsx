"use client";

import { motion, useReducedMotion } from "framer-motion";

const ease = [0.22, 1, 0.36, 1] as const;

const NODES = [
  { id: "restaurant", label: "Restaurant", x: 50, y: 10 },
  { id: "retail", label: "Retail", x: 88, y: 22 },
  { id: "salon", label: "Salon", x: 94, y: 50 },
  { id: "clinic", label: "Clinic", x: 88, y: 78 },
  { id: "hotel", label: "Hotel", x: 50, y: 92 },
  { id: "gym", label: "Gym", x: 12, y: 78 },
  { id: "cafe", label: "Café", x: 6, y: 50 },
  { id: "services", label: "Services", x: 12, y: 22 },
] as const;

const CENTER = { x: 50, y: 50 };

export function IndustriesHeroViz() {
  const reduced = useReducedMotion();

  return (
    <div className="ind-viz" aria-hidden="true">
      <div className="ind-viz__glow" />
      <div className="ind-viz__canvas">
        <svg className="ind-viz__svg" viewBox="0 0 100 100" preserveAspectRatio="none">
          {NODES.map((node) => (
            <line
              key={node.id}
              className="ind-viz__line"
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
                  className="ind-viz__pulse"
                  r="0.65"
                  initial={{ cx: CENTER.x, cy: CENTER.y, opacity: 0 }}
                  animate={{
                    cx: [CENTER.x, node.x],
                    cy: [CENTER.y, node.y],
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 2.4,
                    delay: i * 0.28,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
              ))
            : null}
        </svg>

        <div
          className="ind-viz__node ind-viz__node--core"
          style={{ left: `${CENTER.x}%`, top: `${CENTER.y}%` }}
        >
          <div className="ind-viz__node-core ind-viz__node-core--center">AI</div>
          <span className="ind-viz__node-label">Busal OS</span>
        </div>

        {NODES.map((node) => (
          <div
            key={node.id}
            className="ind-viz__node"
            style={{ left: `${node.x}%`, top: `${node.y}%` }}
          >
            <div className="ind-viz__node-core">{node.label.slice(0, 2)}</div>
            <span className="ind-viz__node-label">{node.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function IndustriesAdaptFlow() {
  const reduced = useReducedMotion();
  const steps = [
    "Business Type",
    "AI Configuration",
    "Business Modules",
    "Automation",
    "Business Insights",
  ];

  return (
    <div className="ind-flow">
      {steps.map((step, i) => (
        <div key={step} className="ind-flow__item">
          {!reduced ? (
            <motion.div
              className="ind-flow__node"
              initial={{ opacity: 0, scale: 0.92 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-8% 0px" }}
              transition={{ duration: 0.45, delay: i * 0.08, ease }}
            >
              <span>{step}</span>
            </motion.div>
          ) : (
            <div className="ind-flow__node">
              <span>{step}</span>
            </div>
          )}
          {i < steps.length - 1 ? (
            <div className="ind-flow__arrow" aria-hidden="true">
              ↓
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

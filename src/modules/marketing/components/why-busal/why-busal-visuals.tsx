"use client";

import { motion, useReducedMotion } from "framer-motion";

import { BusalLogoIcon } from "@/components/brand/busal-logo-icon";

const ease = [0.22, 1, 0.36, 1] as const;

const FRAGMENTED = [
  { id: "pos", label: "POS", x: 14, y: 18 },
  { id: "crm", label: "CRM", x: 86, y: 16 },
  { id: "book", label: "Book", x: 92, y: 42 },
  { id: "wa", label: "Chat", x: 78, y: 72 },
  { id: "xl", label: "Excel", x: 50, y: 88 },
  { id: "mkt", label: "Mktg", x: 22, y: 78 },
  { id: "inv", label: "Stock", x: 8, y: 48 },
  { id: "pay", label: "Pay", x: 38, y: 12 },
] as const;

const CENTER = { x: 50, y: 50 };

export function WhyBusalHeroViz() {
  const reduced = useReducedMotion();

  return (
    <div className="wb-viz" aria-hidden="true">
      <div className="wb-viz__glow" />
      <div className="wb-viz__canvas">
        <svg className="wb-viz__svg" viewBox="0 0 100 100" preserveAspectRatio="none">
          {FRAGMENTED.map((node) => (
            <line
              key={`line-${node.id}`}
              className="wb-viz__line wb-viz__line--chaos"
              x1={node.x}
              y1={node.y}
              x2={CENTER.x}
              y2={CENTER.y}
            />
          ))}
          {!reduced
            ? FRAGMENTED.map((node, i) => (
                <motion.circle
                  key={`pulse-${node.id}`}
                  className="wb-viz__pulse"
                  r="0.55"
                  initial={{ cx: node.x, cy: node.y, opacity: 0.3 }}
                  animate={{
                    cx: [node.x, CENTER.x, node.x],
                    cy: [node.y, CENTER.y, node.y],
                    opacity: [0.3, 1, 0.3],
                  }}
                  transition={{
                    duration: 3.2,
                    delay: i * 0.25,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              ))
            : null}
        </svg>

        {FRAGMENTED.map((node) => (
          <div
            key={node.id}
            className="wb-viz__node wb-viz__node--fragment"
            style={{ left: `${node.x}%`, top: `${node.y}%` }}
          >
            <div className="wb-viz__node-core">{node.label.slice(0, 2)}</div>
          </div>
        ))}

        <div
          className="wb-viz__node wb-viz__node--core"
          style={{ left: `${CENTER.x}%`, top: `${CENTER.y}%` }}
        >
          <div className="wb-viz__node-core wb-viz__node-core--center">
            <BusalLogoIcon className="busal-logo-icon--diagram" aria-hidden />
          </div>
          <span className="wb-viz__node-label">Busal OS</span>
        </div>
      </div>
    </div>
  );
}

export function WhyBusalArchitecture() {
  const reduced = useReducedMotion();
  const steps = ["Customers", "Business", "Busal AI Core", "Operations", "Insights", "Growth"];

  return (
    <div className="wb-arch">
      {steps.map((step, i) => (
        <div key={step} className="wb-arch__item">
          {!reduced ? (
            <motion.div
              className="wb-arch__node"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-8% 0px" }}
              transition={{ duration: 0.45, delay: i * 0.07, ease }}
            >
              <span>{step}</span>
            </motion.div>
          ) : (
            <div className="wb-arch__node">
              <span>{step}</span>
            </div>
          )}
          {i < steps.length - 1 ? (
            <div className="wb-arch__arrow" aria-hidden="true">
              ↓
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

"use client";

import { motion, useReducedMotion } from "framer-motion";
import { BookOpen, Search, Sparkles } from "lucide-react";

const ease = [0.22, 1, 0.36, 1] as const;

const RESULTS = [
  { title: "Complete business onboarding", topic: "Setup" },
  { title: "Configure AI Manager briefings", topic: "AI Agents" },
  { title: "Connect Stripe payments", topic: "Integrations" },
] as const;

export function HelpSearchViz() {
  const reduced = useReducedMotion();

  return (
    <div className="hc-viz">
      <div className="hc-viz__glow" aria-hidden="true" />
      <motion.div
        className="hc-viz__shell"
        initial={reduced ? false : { opacity: 0, y: 16 }}
        animate={reduced ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.15, ease }}
      >
        <div className="hc-viz__head">
          <Sparkles className="h-4 w-4 text-[#8B5CF6]" aria-hidden="true" />
          <p>AI search preview</p>
          <span className="hc-viz__badge">Live</span>
        </div>
        <div className="hc-viz__query">
          <Search className="h-3.5 w-3.5 shrink-0 opacity-50" aria-hidden="true" />
          <span>How do I onboard my team?</span>
        </div>
        <div className="hc-viz__stack">
          {RESULTS.map((item, i) => (
            <motion.div
              key={item.title}
              className="hc-viz__result"
              initial={reduced ? false : { opacity: 0, x: -8 }}
              animate={reduced ? undefined : { opacity: 1, x: 0 }}
              transition={{ duration: 0.45, delay: 0.35 + i * 0.08, ease }}
            >
              <BookOpen className="h-3.5 w-3.5 shrink-0 text-[#93C5FD]" aria-hidden="true" />
              <div>
                <strong>{item.title}</strong>
                <span>{item.topic}</span>
              </div>
            </motion.div>
          ))}
        </div>
        <p className="hc-viz__stat">
          <Sparkles className="h-3.5 w-3.5 text-[#8B5CF6]" aria-hidden="true" />3 matches · ranked
          by relevance
        </p>
      </motion.div>
    </div>
  );
}

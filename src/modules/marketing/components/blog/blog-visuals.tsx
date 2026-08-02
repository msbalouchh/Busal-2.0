"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Newspaper, PenLine, TrendingUp } from "lucide-react";

const ease = [0.22, 1, 0.36, 1] as const;

export function BlogHeroViz() {
  const reduced = useReducedMotion();

  return (
    <div className="bl-viz" aria-hidden="true">
      <div className="bl-viz__glow" />
      <motion.div
        className="bl-viz__shell"
        initial={reduced ? false : { opacity: 0, y: 16, scale: 0.985 }}
        animate={reduced ? undefined : { opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.65, delay: 0.12, ease }}
      >
        <div className="bl-viz__head">
          <Newspaper className="h-4 w-4 text-[#93c5fd]" />
          <p>Busal Publication</p>
          <span className="bl-viz__badge">New weekly</span>
        </div>

        <div className="bl-viz__lines">
          {["AI trends", "Operator playbooks", "Product updates"].map((line, i) => (
            <motion.div
              key={line}
              className="bl-viz__line"
              initial={reduced ? false : { opacity: 0, x: -8 }}
              animate={reduced ? undefined : { opacity: 1, x: 0 }}
              transition={{ duration: 0.45, delay: 0.2 + i * 0.07, ease }}
            >
              <PenLine className="h-3 w-3 text-[#93c5fd]" />
              <span>{line}</span>
            </motion.div>
          ))}
        </div>

        <div className="bl-viz__stat">
          <TrendingUp className="h-3.5 w-3.5 text-[#34d399]" />
          <strong>12k+</strong>
          <span>operators reading monthly</span>
        </div>
      </motion.div>
    </div>
  );
}

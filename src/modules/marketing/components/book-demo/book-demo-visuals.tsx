"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Calendar, Clock, Video } from "lucide-react";

import { DEMO_NEXT_STEPS } from "./book-demo-data";

const ease = [0.22, 1, 0.36, 1] as const;

const NODES = [
  { x: 18, y: 22 },
  { x: 82, y: 18 },
  { x: 88, y: 52 },
  { x: 72, y: 82 },
  { x: 28, y: 78 },
  { x: 12, y: 48 },
] as const;

const CENTER = { x: 50, y: 48 };

export function BookDemoHeroViz() {
  const reduced = useReducedMotion();

  return (
    <div className="bd-viz" aria-hidden="true">
      <div className="bd-viz__glow" />
      <motion.div
        className="bd-viz__shell"
        initial={reduced ? false : { opacity: 0, y: 16, scale: 0.985 }}
        animate={reduced ? undefined : { opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.65, delay: 0.12, ease }}
      >
        <div className="bd-viz__head">
          <Calendar className="h-4 w-4 text-[#93c5fd]" />
          <p>Demo Session</p>
          <span className="bd-viz__live">Live</span>
        </div>

        <div className="bd-viz__slot">
          <div className="bd-viz__slot-date">
            <strong>Wed 14 Aug</strong>
            <span>30 min · Personalized</span>
          </div>
          <div className="bd-viz__slot-time">
            <Clock className="h-3.5 w-3.5" />
            <span>14:00 GMT</span>
          </div>
        </div>

        <div className="bd-viz__preview">
          <svg className="bd-viz__svg" viewBox="0 0 100 100" preserveAspectRatio="none">
            {NODES.map((node, i) => (
              <line
                key={`line-${i}`}
                className="bd-viz__line"
                x1={node.x}
                y1={node.y}
                x2={CENTER.x}
                y2={CENTER.y}
              />
            ))}
            {!reduced
              ? NODES.map((node, i) => (
                  <motion.circle
                    key={`pulse-${i}`}
                    className="bd-viz__pulse"
                    r="0.4"
                    initial={{ cx: node.x, cy: node.y, opacity: 0.3 }}
                    animate={{
                      cx: [node.x, CENTER.x, node.x],
                      cy: [node.y, CENTER.y, node.y],
                      opacity: [0.3, 0.95, 0.3],
                    }}
                    transition={{
                      duration: 3.2,
                      delay: i * 0.2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                ))
              : null}
          </svg>
          <div className="bd-viz__core">
            <Video className="h-5 w-5 text-white" />
          </div>
        </div>

        <ul className="bd-viz__agenda">
          <li>POS &amp; operations walkthrough</li>
          <li>AI agents for your industry</li>
          <li>Migration &amp; pricing Q&amp;A</li>
        </ul>
      </motion.div>
    </div>
  );
}

export function BookDemoTimeline() {
  const reduced = useReducedMotion();

  return (
    <div className="bd-steps">
      {DEMO_NEXT_STEPS.map((item, i) => (
        <div key={item.step} className="bd-steps__item">
          {!reduced ? (
            <motion.div
              className="bd-steps__card"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-6% 0px" }}
              transition={{ duration: 0.45, delay: i * 0.07, ease }}
            >
              <span className="bd-steps__num">{String(i + 1).padStart(2, "0")}</span>
              <strong>{item.step}</strong>
              <p>{item.desc}</p>
            </motion.div>
          ) : (
            <div className="bd-steps__card">
              <span className="bd-steps__num">{String(i + 1).padStart(2, "0")}</span>
              <strong>{item.step}</strong>
              <p>{item.desc}</p>
            </div>
          )}
          {i < DEMO_NEXT_STEPS.length - 1 ? (
            <div className="bd-steps__arrow" aria-hidden="true">
              ↓
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

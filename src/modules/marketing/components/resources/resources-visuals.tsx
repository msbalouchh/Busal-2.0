"use client";

import { motion, useReducedMotion } from "framer-motion";
import { BookOpen, FileText, Play, Sparkles } from "lucide-react";
import Link from "next/link";

import { MARKETING_ROUTES } from "@/modules/marketing/constants/routes";

import { FEATURED_VIDEO } from "./resources-data";

const ease = [0.22, 1, 0.36, 1] as const;

export function ResourcesHeroViz() {
  const reduced = useReducedMotion();

  return (
    <div className="rs-viz" aria-hidden="true">
      <div className="rs-viz__glow" />
      <motion.div
        className="rs-viz__shell"
        initial={reduced ? false : { opacity: 0, y: 16, scale: 0.985 }}
        animate={reduced ? undefined : { opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.65, delay: 0.12, ease }}
      >
        <div className="rs-viz__head">
          <BookOpen className="h-4 w-4 text-[#93c5fd]" />
          <p>Knowledge Hub</p>
          <span className="rs-viz__badge">Updated weekly</span>
        </div>

        <div className="rs-viz__stack">
          {["AI Playbooks", "Operator Guides", "Templates"].map((label, i) => (
            <motion.div
              key={label}
              className="rs-viz__doc"
              initial={reduced ? false : { opacity: 0, x: 12 }}
              animate={reduced ? undefined : { opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 + i * 0.08, ease }}
              style={{ transform: `translateY(${i * 4}px)` }}
            >
              <FileText className="h-3.5 w-3.5 text-[#93c5fd]" />
              <span>{label}</span>
            </motion.div>
          ))}
        </div>

        <div className="rs-viz__stat">
          <Sparkles className="h-3.5 w-3.5 text-[#8B5CF6]" />
          <strong>21+</strong>
          <span>resources for operators</span>
        </div>
      </motion.div>
    </div>
  );
}

export function ResourcesVideoPreview() {
  const reduced = useReducedMotion();

  return (
    <div className="rs-video" id="featured-video">
      <div className="rs-video__glow" aria-hidden="true" />
      <div className="rs-video__frame">
        <div className="rs-video__gradient" aria-hidden="true" />
        {!reduced ? (
          <motion.div whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.98 }}>
            <Link
              href={MARKETING_ROUTES.bookDemo}
              className="rs-video__play"
              aria-label={`Watch demo: ${FEATURED_VIDEO.title}`}
            >
              <Play className="h-6 w-6 fill-white text-white" />
            </Link>
          </motion.div>
        ) : (
          <Link
            href={MARKETING_ROUTES.bookDemo}
            className="rs-video__play"
            aria-label={`Watch demo: ${FEATURED_VIDEO.title}`}
          >
            <Play className="h-6 w-6 fill-white text-white" />
          </Link>
        )}
        <span className="rs-video__duration">{FEATURED_VIDEO.duration}</span>
      </div>
      <div className="rs-video__meta">
        <h3>{FEATURED_VIDEO.title}</h3>
        <p>{FEATURED_VIDEO.desc}</p>
      </div>
    </div>
  );
}

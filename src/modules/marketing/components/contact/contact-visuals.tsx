"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Globe, Mail, MessageSquare } from "lucide-react";

import { CONTACT_REGIONS } from "./contact-data";

const ease = [0.22, 1, 0.36, 1] as const;

export function ContactHeroViz() {
  const reduced = useReducedMotion();

  return (
    <div className="ct-viz" aria-hidden="true">
      <div className="ct-viz__glow" />
      <motion.div
        className="ct-viz__shell"
        initial={reduced ? false : { opacity: 0, y: 16, scale: 0.985 }}
        animate={reduced ? undefined : { opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.65, delay: 0.12, ease }}
      >
        <div className="ct-viz__head">
          <MessageSquare className="h-4 w-4 text-[#93c5fd]" />
          <p>Busal Support</p>
          <span className="ct-viz__live">Online</span>
        </div>

        <div className="ct-viz__channels">
          <div className="ct-viz__channel">
            <Mail className="h-3.5 w-3.5" />
            <div>
              <strong>Sales</strong>
              <span>sales@getbusal.com</span>
            </div>
          </div>
          <div className="ct-viz__channel">
            <Globe className="h-3.5 w-3.5" />
            <div>
              <strong>Global</strong>
              <span>24/7 enterprise SLA</span>
            </div>
          </div>
        </div>

        <div className="ct-viz__thread">
          <div className="ct-viz__bubble ct-viz__bubble--them">
            How can we help transform your operations?
          </div>
          <div className="ct-viz__bubble ct-viz__bubble--you">Book a demo or send an enquiry.</div>
        </div>
      </motion.div>
    </div>
  );
}

export function ContactWorldMap() {
  const reduced = useReducedMotion();

  return (
    <div className="ct-map" aria-hidden="true">
      <div className="ct-map__glow" />
      <div className="ct-map__canvas">
        <div className="ct-map__grid" />
        <div className="ct-map__sphere">
          <div className="ct-map__ring ct-map__ring--a" />
          <div className="ct-map__ring ct-map__ring--b" />
        </div>

        {CONTACT_REGIONS.map((region, i) =>
          reduced ? (
            <div
              key={region.label}
              className={cnPin(region.status)}
              style={{ left: `${region.x}%`, top: `${region.y}%` }}
            >
              <span className="ct-map__dot" />
              <span>{region.label}</span>
            </div>
          ) : (
            <motion.div
              key={region.label}
              className={cnPin(region.status)}
              style={{ left: `${region.x}%`, top: `${region.y}%` }}
              initial={{ opacity: 0, scale: 0.85 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: 0.08 + i * 0.06, ease }}
            >
              <span className="ct-map__dot" />
              <span>{region.label}</span>
            </motion.div>
          ),
        )}

        <div className="ct-map__legend">
          <span className="ct-map__legend-item">
            <i className="ct-map__legend-dot ct-map__legend-dot--current" />
            Current operations
          </span>
          <span className="ct-map__legend-item">
            <i className="ct-map__legend-dot ct-map__legend-dot--expansion" />
            Future expansion
          </span>
        </div>
      </div>
    </div>
  );
}

function cnPin(status: "current" | "expansion") {
  return `ct-map__pin ct-map__pin--${status}`;
}

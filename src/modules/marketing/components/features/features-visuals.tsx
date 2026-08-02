"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Bell, ChartLine, Sparkles, Users, UtensilsCrossed } from "lucide-react";

import { BusalLogoIcon } from "@/components/brand/busal-logo-icon";

const ease = [0.22, 1, 0.36, 1] as const;

const METRICS = [
  { label: "Revenue", value: "£18.4k", delta: "+14%", icon: ChartLine },
  { label: "Orders", value: "412", delta: "+11%", icon: UtensilsCrossed },
  { label: "Guests", value: "1,286", delta: "+8%", icon: Users },
] as const;

const MODULES = [
  ["POS", "Live"],
  ["Kitchen", "12 tickets"],
  ["CRM", "Active"],
  ["AI", "6 agents"],
] as const;

const BARS = [44, 58, 48, 72, 64, 82, 70, 90, 78, 94, 86, 98];

export function FeaturesHeroDashboard() {
  const reduced = useReducedMotion();

  return (
    <div className="feat-dash" aria-hidden="true">
      <div className="feat-dash__glow" />
      <motion.div
        className="feat-dash__shell"
        initial={reduced ? false : { opacity: 0, y: 18, scale: 0.985 }}
        animate={reduced ? undefined : { opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, delay: 0.15, ease }}
      >
        <div className="feat-dash__header">
          <div className="feat-dash__brand">
            <span className="feat-dash__logo">
              <BusalLogoIcon className="busal-logo-icon--fill" aria-hidden />
            </span>
            <div>
              <p>Busal OS · Features</p>
              <span>Live platform preview</span>
            </div>
          </div>
          <span className="feat-dash__bell">
            <Bell className="h-3.5 w-3.5" />
          </span>
        </div>

        <div className="feat-dash__metrics">
          {METRICS.map((card, i) => (
            <motion.div
              key={card.label}
              className="feat-dash__tile"
              initial={reduced ? false : { opacity: 0, y: 10 }}
              animate={reduced ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.28 + i * 0.06, ease }}
            >
              <card.icon className="h-3.5 w-3.5 text-[#3B82F6]" />
              <strong>{card.value}</strong>
              <p>{card.label}</p>
              <span>{card.delta}</span>
            </motion.div>
          ))}
        </div>

        <div className="feat-dash__modules">
          {MODULES.map(([name, status]) => (
            <div key={name} className="feat-dash__module">
              <p>{name}</p>
              <span>{status}</span>
            </div>
          ))}
        </div>

        <div className="feat-dash__chart">
          <div className="feat-dash__chart-head">
            <p>Revenue · 12 weeks</p>
            <Sparkles className="h-3.5 w-3.5 text-[#8B5CF6]" />
          </div>
          <div className="feat-dash__bars">
            {BARS.map((h, i) =>
              reduced ? (
                <div key={i} className="feat-dash__bar" style={{ height: `${h}%` }} />
              ) : (
                <motion.div
                  key={i}
                  className="feat-dash__bar"
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  transition={{ duration: 0.7, delay: 0.45 + i * 0.03, ease }}
                />
              ),
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export function FeaturesWorkflow() {
  const reduced = useReducedMotion();
  const steps = ["Customer", "Order", "Kitchen", "Payment", "CRM", "Loyalty", "AI Insights"];

  return (
    <div className="feat-flow">
      {steps.map((step, i) => (
        <div key={step} className="feat-flow__item">
          {!reduced ? (
            <motion.div
              className="feat-flow__node"
              initial={{ opacity: 0, scale: 0.92 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-8% 0px" }}
              transition={{ duration: 0.45, delay: i * 0.08, ease }}
            >
              <span>{step}</span>
            </motion.div>
          ) : (
            <div className="feat-flow__node">
              <span>{step}</span>
            </div>
          )}
          {i < steps.length - 1 ? (
            <div className="feat-flow__arrow" aria-hidden="true">
              ↓
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function PreviewBars({ bars }: { bars: number[] }) {
  const reduced = useReducedMotion();
  return (
    <div className="feat-preview__bars">
      {bars.map((h, i) =>
        reduced ? (
          <div key={i} className="feat-preview__bar" style={{ height: `${h}%` }} />
        ) : (
          <motion.div
            key={i}
            className="feat-preview__bar"
            initial={{ height: 0 }}
            whileInView={{ height: `${h}%` }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: i * 0.04, ease }}
          />
        ),
      )}
    </div>
  );
}

export function FeatureUiPreview({
  variant,
}: {
  variant: "pos" | "kitchen" | "crm" | "inventory" | "ai" | "analytics";
}) {
  if (variant === "pos") {
    return (
      <div className="feat-preview">
        <div className="feat-preview__chrome">
          <span />
          <span />
          <span />
          <p>POS · Checkout</p>
        </div>
        <div className="feat-preview__body">
          <div className="feat-preview__line feat-preview__line--wide" />
          <div className="feat-preview__line" />
          <div className="feat-preview__line" />
          <div className="feat-preview__total">
            <span>Total</span>
            <strong>£84.50</strong>
          </div>
          <div className="feat-preview__btn">Complete sale</div>
        </div>
      </div>
    );
  }

  if (variant === "kitchen") {
    return (
      <div className="feat-preview">
        <div className="feat-preview__chrome">
          <span />
          <span />
          <span />
          <p>Kitchen Display</p>
        </div>
        <div className="feat-preview__tickets">
          {["Table 12 · 2 items", "Counter · 1 item", "Delivery · 4 items"].map((t) => (
            <div key={t} className="feat-preview__ticket">
              <strong>{t}</strong>
              <span>In progress</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === "crm") {
    return (
      <div className="feat-preview">
        <div className="feat-preview__chrome">
          <span />
          <span />
          <span />
          <p>CRM · Guest profile</p>
        </div>
        <div className="feat-preview__body">
          <div className="feat-preview__avatar" />
          <div className="feat-preview__line feat-preview__line--wide" />
          <div className="feat-preview__line" />
          <div className="feat-preview__tags">
            <span>VIP</span>
            <span>Loyalty Gold</span>
          </div>
        </div>
      </div>
    );
  }

  if (variant === "inventory") {
    return (
      <div className="feat-preview">
        <div className="feat-preview__chrome">
          <span />
          <span />
          <span />
          <p>Inventory · Stock levels</p>
        </div>
        <div className="feat-preview__body">
          {[
            ["Salmon fillet", "Low"],
            ["House wine", "OK"],
            ["Olive oil", "Reorder"],
          ].map(([item, status]) => (
            <div key={item} className="feat-preview__row">
              <span>{item}</span>
              <strong>{status}</strong>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === "ai") {
    return (
      <div className="feat-preview">
        <div className="feat-preview__chrome">
          <span />
          <span />
          <span />
          <p>AI Automation</p>
        </div>
        <div className="feat-preview__body">
          <div className="feat-preview__ai-msg">
            <Sparkles className="h-4 w-4 text-[#8B5CF6]" />
            <p>Reorder salmon before Friday service. Demand up 14% vs last week.</p>
          </div>
          <div className="feat-preview__ai-msg feat-preview__ai-msg--muted">
            <p>Approve purchase order · £240 est.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="feat-preview">
      <div className="feat-preview__chrome">
        <span />
        <span />
        <span />
        <p>Analytics · Dashboard</p>
      </div>
      <div className="feat-preview__body">
        <PreviewBars bars={[42, 58, 48, 72, 64, 88, 76, 92]} />
        <div className="feat-preview__stat-row">
          <span>Revenue</span>
          <strong>+18%</strong>
        </div>
      </div>
    </div>
  );
}

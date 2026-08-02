"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Bell, CalendarDays, ChartLine, Sparkles, Users, UtensilsCrossed } from "lucide-react";

import { BusalLogoIcon } from "@/components/brand/busal-logo-icon";

const ease = [0.22, 1, 0.36, 1] as const;

const METRICS = [
  { label: "Revenue", value: "£12.4k", delta: "+18%", icon: ChartLine },
  { label: "Orders", value: "286", delta: "+12%", icon: UtensilsCrossed },
  { label: "Guests", value: "1,042", delta: "+9%", icon: Users },
] as const;

const RESERVATIONS = [
  ["19:00", "Harper · Party of 4"],
  ["19:30", "Okeke · Party of 2"],
  ["20:15", "Mendez · Party of 6"],
] as const;

const ACTIVITY = [
  ["CRM", "Loyalty tier upgraded · 24 guests"],
  ["Kitchen", "Ticket time under 11m"],
  ["Finance", "Evening deposit reconciled"],
] as const;

const BARS = [38, 52, 44, 68, 56, 74, 62, 80, 70, 88, 76, 92];

export function HomeDashboard() {
  const reduced = useReducedMotion();

  return (
    <div className="home-dash" aria-hidden="true">
      <div className="home-dash__glow" />

      <motion.div
        className="home-dash__shell"
        initial={reduced ? false : { opacity: 0, y: 18, scale: 0.985 }}
        animate={reduced ? undefined : { opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, delay: 0.15, ease }}
      >
        <div className="mb-3 flex items-center justify-between gap-3 px-0.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg">
              <BusalLogoIcon className="busal-logo-icon--fill" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-white">Operations Command</p>
              <p className="truncate text-[10px] text-white/45">Live · Soho Branch</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/70">
              <Bell className="h-3.5 w-3.5" />
              <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-[#3B82F6]" />
            </span>
            <span className="h-8 w-8 rounded-full bg-gradient-to-br from-white/25 to-white/5" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
          {METRICS.map((card, i) => (
            <motion.div
              key={card.label}
              className="home-dash__panel"
              initial={reduced ? false : { opacity: 0, y: 10 }}
              animate={reduced ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.28 + i * 0.06, ease }}
            >
              <div className="flex items-start justify-between gap-1">
                <card.icon className="h-3.5 w-3.5 text-[#3B82F6]" />
                <span className="text-[10px] font-medium text-emerald-400">{card.delta}</span>
              </div>
              <p className="mt-2.5 text-base font-semibold tracking-tight text-white sm:text-lg">
                {card.value}
              </p>
              <p className="text-[11px] text-white/45">{card.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-2.5 grid gap-2.5 sm:grid-cols-[1.35fr_1fr]">
          <div className="home-dash__panel">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-white">Weekly performance</p>
              <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-white/50">
                12 weeks
              </span>
            </div>
            <div className="flex h-16 items-end gap-1 sm:gap-1.5">
              {BARS.map((height, i) => (
                <motion.div
                  key={i}
                  className="min-w-0 flex-1 rounded-sm bg-gradient-to-t from-[#3B82F6]/35 to-[#8B5CF6]/90"
                  initial={reduced ? false : { height: 0 }}
                  animate={{ height: `${height}%` }}
                  transition={{ duration: 0.7, delay: 0.45 + i * 0.03, ease }}
                />
              ))}
            </div>
          </div>

          <div className="home-dash__panel">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-[#8B5CF6]" />
              <p className="text-xs font-semibold text-white">AI Assistant</p>
            </div>
            <div className="space-y-2">
              <div className="rounded-xl bg-[#3B82F6]/15 px-3 py-2 text-[11px] leading-relaxed text-white/80">
                Cover velocity is up 14%. Suggest opening a second seating at 19:30.
              </div>
              <div className="rounded-xl bg-white/5 px-3 py-2 text-[11px] text-white/55">
                3 VIP reservations arriving in 40 minutes.
              </div>
            </div>
          </div>
        </div>

        <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2">
          <div className="home-dash__panel">
            <div className="mb-3 flex items-center gap-2">
              <CalendarDays className="h-3.5 w-3.5 text-[#3B82F6]" />
              <p className="text-xs font-semibold text-white">Reservations</p>
            </div>
            <ul className="space-y-2">
              {RESERVATIONS.map(([time, name]) => (
                <li
                  key={time}
                  className="flex items-center justify-between gap-2 rounded-lg bg-white/[0.03] px-2.5 py-2 text-[11px]"
                >
                  <span className="truncate text-white/80">{name}</span>
                  <span className="shrink-0 font-medium text-[#3B82F6]">{time}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="home-dash__panel">
            <p className="mb-3 text-xs font-semibold text-white">Activity</p>
            <ul className="space-y-2.5">
              {ACTIVITY.map(([tag, text]) => (
                <li key={tag} className="flex gap-2 text-[11px]">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#8B5CF6]" />
                  <span className="min-w-0">
                    <span className="font-medium text-white/90">{tag}</span>
                    <span className="text-white/45"> · {text}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="home-dash__float"
        initial={reduced ? false : { opacity: 0, x: 12, y: 10 }}
        animate={reduced ? undefined : { opacity: 1, x: 0, y: 0 }}
        transition={{ duration: 0.65, delay: 0.8, ease }}
      >
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6]">
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[11px] font-semibold text-white">AI insight ready</p>
            <p className="truncate text-[10px] text-white/50">Demand spike predicted at 8pm</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

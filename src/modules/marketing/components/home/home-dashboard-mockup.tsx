"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Bell, CalendarDays, ChartLine, Sparkles, Users, UtensilsCrossed } from "lucide-react";

import { cn } from "@/lib/utils";

const ease = [0.22, 1, 0.36, 1] as const;

function Glass({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      className={cn(
        "rounded-2xl border border-white/10 bg-white/[0.06] shadow-[0_20px_60px_-28px_rgba(0,0,0,0.65)] backdrop-blur-xl",
        className,
      )}
      initial={reduced ? false : { opacity: 0, y: 18, scale: 0.98 }}
      animate={reduced ? undefined : { opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, delay, ease }}
      whileHover={reduced ? undefined : { y: -3, transition: { duration: 0.25 } }}
    >
      {children}
    </motion.div>
  );
}

function MiniChart() {
  const bars = [38, 52, 44, 68, 56, 74, 62, 80, 70, 88, 76, 92];
  return (
    <div className="flex h-16 items-end gap-1.5">
      {bars.map((h, i) => (
        <motion.div
          key={i}
          className="flex-1 rounded-sm bg-gradient-to-t from-[#3B82F6]/40 to-[#8B5CF6]/90"
          initial={{ height: 0 }}
          animate={{ height: `${h}%` }}
          transition={{ duration: 0.8, delay: 0.55 + i * 0.04, ease }}
        />
      ))}
    </div>
  );
}

export function HomeDashboardMockup() {
  const reduced = useReducedMotion();

  return (
    <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
      <div className="pointer-events-none absolute -inset-8 -z-10 rounded-[2.5rem] bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.35),transparent_45%),radial-gradient(circle_at_80%_70%,rgba(139,92,246,0.28),transparent_40%)] blur-2xl" />

      <Glass className="overflow-hidden p-3 sm:p-4" delay={0.15}>
        <div className="mb-3 flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] text-xs font-bold text-white">
              B
            </span>
            <div>
              <p className="text-xs font-semibold text-white">Operations Command</p>
              <p className="text-[10px] text-white/45">Live · Soho Branch</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/70">
              <Bell className="h-3.5 w-3.5" />
              <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-[#3B82F6]" />
            </span>
            <span className="h-8 w-8 rounded-full bg-gradient-to-br from-white/20 to-white/5" />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { label: "Revenue", value: "£12.4k", delta: "+18%", icon: ChartLine },
            { label: "Orders", value: "286", delta: "+12%", icon: UtensilsCrossed },
            { label: "Guests", value: "1,042", delta: "+9%", icon: Users },
          ].map((card, i) => (
            <Glass key={card.label} className="p-3" delay={0.25 + i * 0.08}>
              <div className="flex items-start justify-between">
                <card.icon className="h-3.5 w-3.5 text-[#3B82F6]" />
                <span className="text-[10px] font-medium text-emerald-400">{card.delta}</span>
              </div>
              <p className="mt-3 text-lg font-semibold tracking-tight text-white">{card.value}</p>
              <p className="text-[11px] text-white/45">{card.label}</p>
            </Glass>
          ))}
        </div>

        <div className="mt-3 grid gap-3 lg:grid-cols-[1.35fr_1fr]">
          <Glass className="p-4" delay={0.45}>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold text-white">Weekly performance</p>
              <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-white/50">
                12 weeks
              </span>
            </div>
            <MiniChart />
          </Glass>

          <Glass className="p-4" delay={0.52}>
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
          </Glass>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Glass className="p-4" delay={0.6}>
            <div className="mb-3 flex items-center gap-2">
              <CalendarDays className="h-3.5 w-3.5 text-[#3B82F6]" />
              <p className="text-xs font-semibold text-white">Reservations</p>
            </div>
            <ul className="space-y-2">
              {[
                ["19:00", "Harper · Party of 4"],
                ["19:30", "Okeke · Party of 2"],
                ["20:15", "Mendez · Party of 6"],
              ].map(([time, name]) => (
                <li
                  key={time}
                  className="flex items-center justify-between rounded-lg bg-white/[0.03] px-2.5 py-2 text-[11px]"
                >
                  <span className="text-white/80">{name}</span>
                  <span className="font-medium text-[#3B82F6]">{time}</span>
                </li>
              ))}
            </ul>
          </Glass>

          <Glass className="p-4" delay={0.68}>
            <p className="mb-3 text-xs font-semibold text-white">Activity</p>
            <ul className="space-y-2.5">
              {[
                ["CRM", "Loyalty tier upgraded · 24 guests"],
                ["Kitchen", "Ticket time under 11m"],
                ["Finance", "Evening deposit reconciled"],
              ].map(([tag, text]) => (
                <li key={tag} className="flex gap-2 text-[11px]">
                  <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#8B5CF6]" />
                  <span>
                    <span className="font-medium text-white/90">{tag}</span>
                    <span className="text-white/45"> · {text}</span>
                  </span>
                </li>
              ))}
            </ul>
          </Glass>
        </div>
      </Glass>

      <motion.div
        className="home-pulse-glow absolute -right-2 -bottom-3 z-10 max-w-[220px] rounded-2xl border border-white/15 bg-[#12182b]/92 p-3 shadow-2xl backdrop-blur-xl sm:-right-4 sm:bottom-6"
        initial={reduced ? false : { opacity: 0, x: 16, y: 12 }}
        animate={reduced ? undefined : { opacity: 1, x: 0, y: 0 }}
        transition={{ duration: 0.7, delay: 0.85, ease }}
      >
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6]">
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </span>
          <div>
            <p className="text-[11px] font-semibold text-white">AI insight ready</p>
            <p className="text-[10px] text-white/50">Demand spike predicted at 8pm</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

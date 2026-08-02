"use client";

import { useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

const NAV = ["Dashboard", "Orders", "Kitchen", "CRM", "AI"] as const;

const PANELS: Record<(typeof NAV)[number], ReactNode> = {
  Dashboard: (
    <>
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Today", value: "£12.4k" },
          { label: "Orders", value: "186" },
          { label: "Ready", value: "94%" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-marketing-surface border-marketing-line rounded-2xl border p-3"
          >
            <p className="text-marketing-muted text-[11px]">{stat.label}</p>
            <p className="font-marketing-display text-marketing-ink mt-1 text-xl">{stat.value}</p>
          </div>
        ))}
      </div>
      <div className="bg-marketing-surface border-marketing-line rounded-2xl border p-4">
        <p className="text-marketing-muted text-xs">Revenue pulse</p>
        <div className="mt-4 flex h-16 items-end gap-1.5">
          {[40, 55, 48, 70, 62, 85, 78, 92, 88, 96].map((h, i) => (
            <div
              key={i}
              className="bg-marketing-accent/70 flex-1 rounded-t-sm"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </div>
    </>
  ),
  Orders: (
    <div className="bg-marketing-surface border-marketing-line space-y-2 rounded-2xl border p-4">
      <p className="text-marketing-muted text-xs">Live orders</p>
      {[
        { id: "#1842", status: "Preparing", meta: "Table 12 · £64.00" },
        { id: "#1841", status: "Ready", meta: "Takeaway · £28.50" },
        { id: "#1840", status: "New", meta: "QR · £19.00" },
      ].map((row) => (
        <div
          key={row.id}
          className="border-marketing-line flex items-center justify-between rounded-xl border px-3 py-2.5 text-sm"
        >
          <div>
            <p className="font-medium">{row.id}</p>
            <p className="text-marketing-muted text-xs">{row.meta}</p>
          </div>
          <span className="bg-marketing-accent/15 text-marketing-accent rounded-md px-2 py-0.5 text-[11px] font-medium">
            {row.status}
          </span>
        </div>
      ))}
    </div>
  ),
  Kitchen: (
    <div className="bg-marketing-surface border-marketing-line rounded-2xl border p-4">
      <p className="text-marketing-muted text-xs">Kitchen queue</p>
      <div className="mt-3 space-y-2">
        {["Table 12 · Preparing", "Takeaway #41 · Ready", "QR · New"].map((row) => (
          <div
            key={row}
            className="border-marketing-line/80 flex items-center justify-between rounded-xl border px-3 py-2 text-sm"
          >
            <span>{row}</span>
            <span className="bg-marketing-accent/15 text-marketing-accent rounded-md px-2 py-0.5 text-[11px] font-medium">
              Live
            </span>
          </div>
        ))}
      </div>
    </div>
  ),
  CRM: (
    <div className="bg-marketing-surface border-marketing-line space-y-2 rounded-2xl border p-4">
      <p className="text-marketing-muted text-xs">Guest insights</p>
      {[
        { name: "Amira H.", note: "VIP · 12 visits" },
        { name: "James O.", note: "Loyalty · Prefers terrace" },
        { name: "Sofia M.", note: "New · Birthday week" },
      ].map((guest) => (
        <div
          key={guest.name}
          className="border-marketing-line rounded-xl border px-3 py-2.5 text-sm"
        >
          <p className="font-medium">{guest.name}</p>
          <p className="text-marketing-muted text-xs">{guest.note}</p>
        </div>
      ))}
    </div>
  ),
  AI: (
    <div className="bg-marketing-ink text-marketing-surface rounded-2xl p-4">
      <p className="text-[11px] tracking-[0.16em] text-white/45 uppercase">AI briefing</p>
      <p className="font-marketing-display mt-2 text-lg leading-snug">
        Cover demand up 14%. Low stock on citrus. Two VIP reservations tonight.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {["Sales", "Ops", "Finance"].map((a) => (
          <span
            key={a}
            className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-xs"
          >
            {a}
          </span>
        ))}
      </div>
    </div>
  ),
};

export function DashboardPreview() {
  const [active, setActive] = useState<(typeof NAV)[number]>("Dashboard");

  return (
    <div className="border-marketing-line from-marketing-panel via-marketing-surface to-marketing-panel relative overflow-hidden rounded-[1.75rem] border bg-gradient-to-br p-3 shadow-[0_30px_80px_-40px_rgba(12,18,34,0.45)] sm:p-4">
      <div className="bg-marketing-ink/[0.03] pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(13,115,119,0.18),transparent_45%)]" />
      <div className="relative grid gap-3 lg:grid-cols-[0.9fr_1.4fr]">
        <div className="bg-marketing-ink text-marketing-surface rounded-2xl p-4">
          <div className="mb-6 flex items-center gap-2">
            <span className="bg-marketing-accent h-2.5 w-2.5 rounded-full" aria-hidden />
            <span className="text-xs tracking-wide text-white/70">Busal OS</span>
          </div>
          <div className="space-y-1" role="tablist" aria-label="Dashboard preview modules">
            {NAV.map((item) => (
              <button
                key={item}
                type="button"
                role="tab"
                aria-selected={active === item}
                onClick={() => setActive(item)}
                className={cn(
                  "w-full rounded-lg px-3 py-2 text-left text-sm transition",
                  active === item
                    ? "bg-white/10 text-white"
                    : "text-white/55 hover:bg-white/5 hover:text-white/80",
                )}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-3" role="tabpanel" aria-label={`${active} preview`}>
          {PANELS[active]}
        </div>
      </div>
    </div>
  );
}

export function AiPreview() {
  return (
    <div className="border-marketing-line bg-marketing-ink text-marketing-surface relative overflow-hidden rounded-[1.75rem] border p-6 sm:p-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(13,115,119,0.35),transparent_40%)]" />
      <div className="relative">
        <p className="text-xs tracking-[0.18em] text-white/45 uppercase">AI briefing</p>
        <p className="font-marketing-display mt-3 max-w-xl text-2xl leading-snug tracking-tight sm:text-3xl">
          Cover demand is up 14%. Low stock on citrus. Two VIP reservations tonight.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {[
            { name: "Sales agent", hint: "Upsell windows identified" },
            { name: "Ops agent", hint: "Kitchen load balanced" },
            { name: "Finance agent", hint: "Margin watch active" },
          ].map((agent) => (
            <div
              key={agent.name}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
            >
              <p className="text-sm font-medium">{agent.name}</p>
              <p className="mt-1 text-xs text-white/55">{agent.hint}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

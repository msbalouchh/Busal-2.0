"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

function parseTarget(value: string): { prefix: string; end: number; suffix: string } {
  const match = value.match(/^([^0-9]*)([0-9]+(?:\.[0-9]+)?)(.*)$/);
  if (!match) return { prefix: "", end: 0, suffix: value };
  return {
    prefix: match[1] ?? "",
    end: Number(match[2]),
    suffix: match[3] ?? "",
  };
}

export function AnimatedStat({
  value,
  label,
  hint,
  className,
}: {
  value: string;
  label: string;
  hint?: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [display, setDisplay] = useState(value);
  const [started, setStarted] = useState(false);
  const parsed = parseTarget(value);
  const canAnimate = Number.isFinite(parsed.end) && parsed.end > 0 && /[0-9]/.test(value);

  useEffect(() => {
    const node = ref.current;
    if (!node || !canAnimate) return;

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setDisplay(value);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [canAnimate, value]);

  useEffect(() => {
    if (!started || !canAnimate) return;
    const duration = 1100;
    const start = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = parsed.end * eased;
      const formatted =
        Number.isInteger(parsed.end) && !value.includes(".")
          ? Math.round(current).toString()
          : current.toFixed(1).replace(/\.0$/, "");
      setDisplay(`${parsed.prefix}${formatted}${parsed.suffix}`);
      if (progress < 1) frame = requestAnimationFrame(tick);
      else setDisplay(value);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [started, canAnimate, parsed.end, parsed.prefix, parsed.suffix, value]);

  return (
    <div ref={ref} className={cn("border-marketing-line border-t pt-5", className)}>
      <p className="font-marketing-display text-marketing-ink text-4xl tracking-tight tabular-nums">
        {display}
      </p>
      <p className="text-marketing-ink mt-2 text-sm font-semibold">{label}</p>
      {hint ? <p className="text-marketing-muted mt-1 text-sm">{hint}</p> : null}
    </div>
  );
}

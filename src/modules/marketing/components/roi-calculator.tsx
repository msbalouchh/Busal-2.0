"use client";

import { useMemo, useState } from "react";

import { Label } from "@/components/ui/label";
import { MarketingPrimaryCta } from "@/modules/marketing/components/marketing-cta";
import { MARKETING_ROUTES } from "@/modules/marketing/constants/routes";

export function RoiCalculator() {
  const [locations, setLocations] = useState(2);
  const [tools, setTools] = useState(4);
  const [hours, setHours] = useState(8);

  const result = useMemo(() => {
    const toolSavings = tools * 89 * locations;
    const labourSavings = hours * 28 * 4.2;
    const monthly = Math.round(toolSavings * 0.55 + labourSavings);
    const annual = monthly * 12;
    return { monthly, annual };
  }, [locations, tools, hours]);

  return (
    <div className="border-marketing-line bg-marketing-panel rounded-3xl border p-6 sm:p-8">
      <h3 className="font-marketing-display text-marketing-ink text-2xl tracking-tight">
        Estimate your operational return
      </h3>
      <p className="text-marketing-muted mt-2 text-sm leading-relaxed">
        Illustrative model based on typical tool consolidation and manager hours recovered. Not a
        guarantee—your demo will refine the numbers.
      </p>

      <div className="mt-8 grid gap-6 sm:grid-cols-3">
        <SliderField
          id="roi-locations"
          label="Locations"
          value={locations}
          min={1}
          max={20}
          onChange={setLocations}
        />
        <SliderField
          id="roi-tools"
          label="Tools replaced"
          value={tools}
          min={1}
          max={12}
          onChange={setTools}
        />
        <SliderField
          id="roi-hours"
          label="Hours saved / week"
          value={hours}
          min={2}
          max={40}
          onChange={setHours}
        />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="bg-marketing-surface border-marketing-line rounded-2xl border px-5 py-5">
          <p className="text-marketing-muted text-xs font-semibold tracking-wide uppercase">
            Estimated monthly value
          </p>
          <p className="font-marketing-display text-marketing-ink mt-2 text-4xl tracking-tight">
            £{result.monthly.toLocaleString("en-GB")}
          </p>
        </div>
        <div className="bg-marketing-surface border-marketing-line rounded-2xl border px-5 py-5">
          <p className="text-marketing-muted text-xs font-semibold tracking-wide uppercase">
            Estimated annual value
          </p>
          <p className="font-marketing-display text-marketing-ink mt-2 text-4xl tracking-tight">
            £{result.annual.toLocaleString("en-GB")}
          </p>
        </div>
      </div>

      <div className="mt-6">
        <MarketingPrimaryCta href={MARKETING_ROUTES.bookDemo}>
          Validate with a demo
        </MarketingPrimaryCta>
      </div>
    </div>
  );
}

function SliderField({
  id,
  label,
  value,
  min,
  max,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id}>{label}</Label>
        <span className="text-marketing-ink text-sm font-semibold tabular-nums">{value}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="accent-marketing-accent mt-3 w-full"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
      />
    </div>
  );
}

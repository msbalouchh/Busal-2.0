"use client";

import { useMemo, useState } from "react";

import { Label } from "@/components/ui/label";
import { Reveal } from "@/modules/marketing/components/home/home-motion";
import Link from "next/link";
import { MARKETING_ROUTES } from "@/modules/marketing/constants/routes";

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
    <div className="price-roi__field">
      <div className="price-roi__field-head">
        <Label htmlFor={id} className="price-roi__label">
          {label}
        </Label>
        <span className="price-roi__value">{value}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="price-roi__range"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
      />
    </div>
  );
}

export function PricingRoiCalculator() {
  const [locations, setLocations] = useState(2);
  const [staff, setStaff] = useState(12);
  const [hours, setHours] = useState(10);

  const result = useMemo(() => {
    const timeSaved = Math.round(hours * 4.3 * locations);
    const revenueIncrease = Math.round(locations * staff * 145);
    const labourSavings = Math.round(hours * 28 * 4.3 * locations);
    const efficiency = Math.min(94, Math.round(38 + locations * 4 + staff * 1.2));
    return { timeSaved, revenueIncrease, labourSavings, efficiency };
  }, [locations, staff, hours]);

  return (
    <Reveal>
      <div className="price-roi">
        <div className="price-roi__intro">
          <h3 className="price-roi__title">Estimate your return</h3>
          <p className="price-roi__lead">
            Illustrative model based on tool consolidation and manager hours recovered. Your demo
            will refine these numbers for your operation.
          </p>
        </div>

        <div className="price-roi__sliders">
          <SliderField
            id="price-roi-locations"
            label="Locations"
            value={locations}
            min={1}
            max={20}
            onChange={setLocations}
          />
          <SliderField
            id="price-roi-staff"
            label="Staff members"
            value={staff}
            min={3}
            max={80}
            onChange={setStaff}
          />
          <SliderField
            id="price-roi-hours"
            label="Admin hours saved / week"
            value={hours}
            min={2}
            max={40}
            onChange={setHours}
          />
        </div>

        <div className="price-roi__results">
          {[
            { label: "Time saved", value: `${result.timeSaved} hrs/mo` },
            {
              label: "Revenue increase",
              value: `£${result.revenueIncrease.toLocaleString("en-GB")}/mo`,
            },
            {
              label: "Labour savings",
              value: `£${result.labourSavings.toLocaleString("en-GB")}/mo`,
            },
            { label: "Operational efficiency", value: `${result.efficiency}%` },
          ].map((item) => (
            <div key={item.label} className="price-roi__result">
              <p>{item.label}</p>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>

        <Link
          href={MARKETING_ROUTES.bookDemo}
          className="home-btn home-btn--primary price-roi__cta"
        >
          Validate with a demo
        </Link>
      </div>
    </Reveal>
  );
}

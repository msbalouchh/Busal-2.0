"use client";

import { useBusiness } from "@/modules/tenant/hooks/use-business";

interface TenantBusinessSwitcherProps {
  className?: string;
}

/** Mock business switcher for the tenant foundation. */
export function TenantBusinessSwitcher({ className }: TenantBusinessSwitcherProps) {
  const { business, businesses, switchBusiness } = useBusiness();

  return (
    <label className={className}>
      <span className="sr-only">Business</span>
      <select
        aria-label="Switch business"
        value={business.id}
        onChange={(event) => switchBusiness(event.target.value)}
        className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
      >
        {businesses.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </select>
    </label>
  );
}

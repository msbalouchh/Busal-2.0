"use client";

import { Building2 } from "lucide-react";

import { useBusinessContext } from "@/modules/business-context/components/business-context-provider";

export function BusinessSwitcher() {
  const { businessId, businessName, accessibleBusinesses, isOwner, switchBusiness, isPending } =
    useBusinessContext();

  if (!isOwner || accessibleBusinesses.length <= 1) {
    return <span className="truncate text-sm font-semibold">{businessName}</span>;
  }

  return (
    <label className="flex min-w-0 items-center gap-2">
      <Building2 className="h-4 w-4 shrink-0" />
      <select
        className="max-w-[220px] truncate bg-transparent text-sm font-semibold outline-none"
        value={businessId}
        disabled={isPending}
        onChange={(event) => switchBusiness(event.target.value)}
        aria-label="Switch business"
      >
        {accessibleBusinesses.map((business) => (
          <option key={business.id} value={business.id} disabled={!business.isOnboarded}>
            {business.name}
          </option>
        ))}
      </select>
    </label>
  );
}

"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";

import { CrmContext } from "@/modules/crm/contexts/crm-context";
import { customerRepository } from "@/modules/crm/repository/customer-repository";
import {
  buildCrmPlatformContext,
  buildCrmPlatformSnapshot,
  type CrmPlatformInput,
} from "@/modules/crm/services/crm-platform.service";
import type { CrmContextValue, CustomerSearchQuery } from "@/modules/crm/types/customer";

interface CrmProviderProps {
  children: ReactNode;
  initialInput?: CrmPlatformInput;
}

export function CrmProvider({ children, initialInput }: CrmProviderProps) {
  const [input] = useState<CrmPlatformInput>(() => initialInput ?? {});
  const [snapshot, setSnapshot] = useState(() => buildCrmPlatformSnapshot(input));
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setSnapshot(buildCrmPlatformSnapshot(input));
  }, [input]);

  const value = useMemo<CrmContextValue>(() => {
    const context = buildCrmPlatformContext(input);
    const selectedCustomer = selectedCustomerId
      ? (customerRepository.findById(selectedCustomerId) ?? null)
      : null;

    return {
      context,
      customers: snapshot.customers,
      segments: snapshot.segments,
      tags: snapshot.tags,
      selectedCustomer,
      selectCustomer: setSelectedCustomerId,
      searchCustomers: (query: CustomerSearchQuery) =>
        customerRepository.search({
          ...query,
          tenantId: query.tenantId ?? context.tenantId,
          businessId: query.businessId ?? context.businessId,
        }),
      refresh,
    };
  }, [input, snapshot, selectedCustomerId, refresh]);

  return <CrmContext.Provider value={value}>{children}</CrmContext.Provider>;
}

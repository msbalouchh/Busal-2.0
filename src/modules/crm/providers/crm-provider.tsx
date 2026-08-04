"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";

import { CrmContext } from "@/modules/crm/contexts/crm-context";
import {
  buildCrmPlatformContext,
  type CrmPlatformInput,
  type CrmPlatformSnapshot,
} from "@/modules/crm/services/crm-platform.service";
import type { CrmContextValue, CustomerSearchQuery } from "@/modules/crm/types/customer";

interface CrmProviderProps {
  children: ReactNode;
  initialInput?: CrmPlatformInput;
  initialSnapshot?: CrmPlatformSnapshot;
}

export function CrmProvider({ children, initialInput, initialSnapshot }: CrmProviderProps) {
  const [input] = useState<CrmPlatformInput>(
    () => initialInput ?? { businessId: initialSnapshot?.context.businessId ?? "" },
  );
  const [snapshot, setSnapshot] = useState<CrmPlatformSnapshot | null>(initialSnapshot ?? null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  const refresh = useCallback(() => {
    void fetch("/api/crm/customers?pageSize=100")
      .then((response) => response.json())
      .then(
        (payload: { success: boolean; data?: { records: CrmPlatformSnapshot["customers"] } }) => {
          if (!payload.success || !payload.data) {
            return;
          }

          setSnapshot((current) =>
            current
              ? {
                  ...current,
                  customers: payload.data!.records,
                  totalCustomers: payload.data!.records.length,
                }
              : null,
          );
        },
      )
      .catch(() => undefined);
  }, []);

  const value = useMemo<CrmContextValue>(() => {
    const context = snapshot?.context ?? buildCrmPlatformContext(input);
    const customers = snapshot?.customers ?? [];
    const selectedCustomer = selectedCustomerId
      ? (customers.find((record) => record.customer.id === selectedCustomerId) ?? null)
      : null;

    return {
      context,
      customers,
      segments: snapshot?.segments ?? [],
      tags: snapshot?.tags ?? [],
      selectedCustomer,
      selectCustomer: setSelectedCustomerId,
      searchCustomers: (query: CustomerSearchQuery) => {
        const normalized = query.query?.toLowerCase() ?? "";
        let results = customers;

        if (query.status) {
          results = results.filter((record) => record.customer.status === query.status);
        }

        if (query.segmentId) {
          results = results.filter((record) =>
            record.customer.segmentIds.includes(query.segmentId!),
          );
        }

        if (query.tagId) {
          results = results.filter((record) => record.customer.tagIds.includes(query.tagId!));
        }

        if (normalized) {
          results = results.filter((record) => {
            const haystack = [
              record.profile.displayName,
              record.profile.email ?? "",
              record.profile.phone ?? "",
            ]
              .join(" ")
              .toLowerCase();
            return haystack.includes(normalized);
          });
        }

        const limit = query.limit ?? query.pageSize ?? results.length;
        return results.slice(0, limit);
      },
      refresh,
    };
  }, [input, snapshot, selectedCustomerId, refresh]);

  return <CrmContext.Provider value={value}>{children}</CrmContext.Provider>;
}

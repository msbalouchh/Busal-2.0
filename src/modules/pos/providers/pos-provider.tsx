"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";

import { PosContext } from "@/modules/pos/contexts/pos-context";
import { buildPosPlatformContext } from "@/modules/pos/lib/pos-platform-context";
import type {
  PosCashDrawer,
  PosContextValue,
  PosEmployee,
  PosPlatformContext,
  PosRegister,
  PosSearchQuery,
  PosSession,
  PosShift,
  PosTerminal,
} from "@/modules/pos/types/pos-platform";

interface PosPlatformSnapshotExtended {
  context: PosPlatformContext;
  records: PosContextValue["records"];
  registers: PosRegister[];
  terminals: PosTerminal[];
  shifts: PosShift[];
  employees: PosEmployee[];
  cashDrawers: PosCashDrawer[];
  activeSession: PosSession | null;
}

interface PosProviderProps {
  children: ReactNode;
  initialInput?: PosPlatformContext;
  initialSnapshot?: PosPlatformSnapshotExtended;
}

export function PosProvider({ children, initialInput, initialSnapshot }: PosProviderProps) {
  const [input] = useState<PosPlatformContext>(
    () =>
      initialInput ??
      initialSnapshot?.context ??
      buildPosPlatformContext({ businessId: "", branchId: "" }),
  );
  const [snapshot, setSnapshot] = useState<PosPlatformSnapshotExtended | null>(
    initialSnapshot ?? null,
  );
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setIsRefreshing(true);
    setError(null);

    void fetch("/api/pos?snapshot=true")
      .then(async (response) => {
        const payload = (await response.json()) as {
          success: boolean;
          data?: PosPlatformSnapshotExtended;
          error?: string;
        };

        if (!payload.success || !payload.data) {
          throw new Error(payload.error ?? "Failed to refresh POS data");
        }

        setSnapshot(payload.data);
      })
      .catch((refreshError: unknown) => {
        setError(refreshError instanceof Error ? refreshError.message : "Refresh failed");
      })
      .finally(() => {
        setIsRefreshing(false);
      });
  }, []);

  const value = useMemo<PosContextValue>(() => {
    const context = snapshot?.context ?? input;
    const records = snapshot?.records ?? [];
    const selectedOrder = selectedOrderId
      ? (records.find((record) => record.order.id === selectedOrderId) ?? null)
      : null;

    return {
      context,
      records,
      registers: snapshot?.registers ?? [],
      terminals: snapshot?.terminals ?? [],
      shifts: snapshot?.shifts ?? [],
      employees: snapshot?.employees ?? [],
      cashDrawers: snapshot?.cashDrawers ?? [],
      activeSession: snapshot?.activeSession ?? null,
      selectedOrderId,
      selectedOrder,
      selectOrder: setSelectedOrderId,
      searchOrders: (query: PosSearchQuery) => {
        let results = [...records];

        if (query.status) {
          results = results.filter((record) => record.order.status === query.status);
        }

        if (query.paymentType) {
          results = results.filter((record) =>
            record.payments.some((payment) => payment.paymentType === query.paymentType),
          );
        }

        if (query.query) {
          const term = query.query.toLowerCase();
          results = results.filter(
            (record) =>
              record.order.orderNumber.toLowerCase().includes(term) ||
              (record.order.tableLabel?.toLowerCase().includes(term) ?? false),
          );
        }

        if (query.limit) {
          results = results.slice(0, query.limit);
        }

        return results;
      },
      refresh,
      isRefreshing,
      error,
    };
  }, [input, snapshot, selectedOrderId, refresh, isRefreshing, error]);

  return <PosContext.Provider value={value}>{children}</PosContext.Provider>;
}

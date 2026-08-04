"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";

import { PosContext } from "@/modules/pos/contexts/pos-context";
import { posRepository } from "@/modules/pos/repository/pos-repository";
import {
  buildPosPlatformContext,
  buildPosPlatformSnapshot,
  type PosPlatformInput,
} from "@/modules/pos/services/pos-platform.service";
import type { PosContextValue, PosSearchQuery } from "@/modules/pos/types/pos-platform";

interface PosProviderProps {
  children: ReactNode;
  initialInput?: PosPlatformInput;
}

export function PosProvider({ children, initialInput }: PosProviderProps) {
  const [input] = useState<PosPlatformInput>(() => initialInput ?? {});
  const [snapshot, setSnapshot] = useState(() => buildPosPlatformSnapshot(input));
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setSnapshot(buildPosPlatformSnapshot(input));
  }, [input]);

  const value = useMemo<PosContextValue>(() => {
    const context = buildPosPlatformContext(input);
    const selectedOrder = selectedOrderId
      ? (posRepository.findById(selectedOrderId) ?? null)
      : null;

    return {
      context,
      records: snapshot.records,
      registers: posRepository.listRegisters(),
      terminals: posRepository.listTerminals(),
      shifts: posRepository.listShifts(),
      employees: posRepository.listEmployees(),
      cashDrawers: posRepository.listCashDrawers(),
      activeSession: posRepository.getActiveSession(),
      selectedOrderId,
      selectedOrder,
      selectOrder: setSelectedOrderId,
      searchOrders: (query: PosSearchQuery) =>
        posRepository.search({
          ...query,
          tenantId: query.tenantId ?? context.tenantId,
          businessId: query.businessId ?? context.businessId,
          branchId: query.branchId ?? context.branchId,
          registerId: query.registerId ?? context.registerId,
        }),
      refresh,
    };
  }, [input, snapshot, selectedOrderId, refresh]);

  return <PosContext.Provider value={value}>{children}</PosContext.Provider>;
}

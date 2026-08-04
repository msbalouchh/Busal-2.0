"use client";

import { useMemo } from "react";

import { usePosContext } from "@/modules/pos/hooks/use-pos";
import type { PosShiftContextValue } from "@/modules/pos/types/pos-platform";

export function usePosShift(shiftId?: string): PosShiftContextValue {
  const { shifts, context, refresh } = usePosContext();

  return useMemo<PosShiftContextValue>(() => {
    const shift = shiftId
      ? (shifts.find((s) => s.id === shiftId) ?? null)
      : (shifts.find((s) => s.id === context.shiftId) ?? null);

    if (!shift) {
      return {
        shift: null,
        isOpen: false,
        totalSalesCents: 0,
        transactionCount: 0,
        refresh,
      };
    }

    return {
      shift,
      isOpen: shift.status === "open",
      totalSalesCents: shift.totalSalesCents,
      transactionCount: shift.transactionCount,
      refresh,
    };
  }, [shiftId, shifts, context.shiftId, refresh]);
}

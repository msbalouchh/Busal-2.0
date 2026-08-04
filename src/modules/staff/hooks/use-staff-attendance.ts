"use client";

import { useMemo } from "react";

import { useStaffContext } from "@/modules/staff/hooks/use-staff";
import {
  countAbsentToday,
  countLateToday,
  countPresentToday,
} from "@/modules/staff/utils/staff-attendance-utils";
import type { StaffAttendanceContextValue } from "@/modules/staff/types/staff-platform";

export function useStaffAttendance(): StaffAttendanceContextValue {
  const { records, refresh } = useStaffContext();

  return useMemo<StaffAttendanceContextValue>(() => {
    const today = "2026-02-15";
    const attendance = records.flatMap((r) => r.attendance);

    return {
      attendance,
      presentTodayCount: countPresentToday(records, today),
      absentTodayCount: countAbsentToday(records, today),
      lateTodayCount: countLateToday(records, today),
      refresh,
    };
  }, [records, refresh]);
}

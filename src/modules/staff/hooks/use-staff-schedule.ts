"use client";

import { useMemo } from "react";

import { useStaffContext } from "@/modules/staff/hooks/use-staff";
import { STAFF_SHIFT_STATUSES } from "@/modules/staff/constants/staff-status";
import { sortShiftsByStartTime } from "@/modules/staff/utils/staff-schedule-utils";
import type { StaffScheduleContextValue } from "@/modules/staff/types/staff-platform";

export function useStaffSchedule(staffId?: string): StaffScheduleContextValue {
  const { records, selectedStaff, refresh } = useStaffContext();

  return useMemo<StaffScheduleContextValue>(() => {
    const targetRecords = staffId
      ? records.filter((r) => r.member.id === staffId)
      : selectedStaff
        ? [selectedStaff]
        : records;

    const shifts = targetRecords.flatMap((r) => r.shifts);
    const schedules = targetRecords.flatMap((r) => r.schedules);
    const today = "2026-02-15";

    const upcomingShifts = sortShiftsByStartTime(
      shifts.filter((s) => s.shiftDate >= today && s.status === STAFF_SHIFT_STATUSES.SCHEDULED),
    );

    return {
      shifts,
      schedules,
      upcomingShifts,
      refresh,
    };
  }, [staffId, records, selectedStaff, refresh]);
}

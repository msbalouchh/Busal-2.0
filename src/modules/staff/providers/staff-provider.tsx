"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";

import { StaffContext } from "@/modules/staff/contexts/staff-context";
import { staffRepository } from "@/modules/staff/repository/staff-repository";
import {
  buildStaffPlatformContext,
  buildStaffPlatformSnapshot,
  type StaffPlatformInput,
} from "@/modules/staff/services/staff-platform.service";
import type { StaffContextValue, StaffSearchQuery } from "@/modules/staff/types/staff-platform";

interface StaffProviderProps {
  children: ReactNode;
  initialInput?: StaffPlatformInput;
}

export function StaffProvider({ children, initialInput }: StaffProviderProps) {
  const [input] = useState<StaffPlatformInput>(() => initialInput ?? {});
  const [snapshot, setSnapshot] = useState(() => buildStaffPlatformSnapshot(input));
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setSnapshot(buildStaffPlatformSnapshot(input));
  }, [input]);

  const value = useMemo<StaffContextValue>(() => {
    const context = buildStaffPlatformContext(input);
    const selectedStaff = selectedStaffId
      ? (staffRepository.findById(selectedStaffId) ?? null)
      : null;

    return {
      context,
      records: snapshot.records,
      departments: staffRepository.listDepartments(),
      designations: staffRepository.listDesignations(),
      selectedStaffId,
      selectedStaff,
      selectStaff: setSelectedStaffId,
      searchStaff: (query: StaffSearchQuery) =>
        staffRepository.search({
          ...query,
          tenantId: query.tenantId ?? context.tenantId,
          businessId: query.businessId ?? context.businessId,
          branchId: query.branchId ?? context.branchId,
        }),
      refresh,
    };
  }, [input, snapshot, selectedStaffId, refresh]);

  return <StaffContext.Provider value={value}>{children}</StaffContext.Provider>;
}

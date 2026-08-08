"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";

import { StaffContext } from "@/modules/staff/contexts/staff-context";
import { buildStaffPlatformContext } from "@/modules/staff/lib/staff-platform-context";
import type {
  Department,
  Designation,
  StaffContextValue,
  StaffPlatformContext,
  StaffPlatformSnapshot,
  StaffRecord,
  StaffSearchQuery,
} from "@/modules/staff/types/staff-platform";

interface StaffPlatformSnapshotExtended extends StaffPlatformSnapshot {
  departments: Department[];
  designations: Designation[];
}

interface StaffProviderProps {
  children: ReactNode;
  initialInput?: StaffPlatformContext;
  initialSnapshot?: StaffPlatformSnapshotExtended;
}

export function StaffProvider({ children, initialInput, initialSnapshot }: StaffProviderProps) {
  const [input] = useState<StaffPlatformContext>(
    () =>
      initialInput ??
      initialSnapshot?.context ??
      buildStaffPlatformContext({ businessId: "", branchId: "" }),
  );
  const [snapshot, setSnapshot] = useState<StaffPlatformSnapshotExtended | null>(
    initialSnapshot ?? null,
  );
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setIsRefreshing(true);
    setError(null);

    void fetch("/api/staff?snapshot=true")
      .then(async (response) => {
        const payload = (await response.json()) as {
          success: boolean;
          data?: StaffPlatformSnapshotExtended;
          error?: string;
        };

        if (!payload.success || !payload.data) {
          throw new Error(payload.error ?? "Failed to refresh staff data");
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

  const value = useMemo<StaffContextValue>(() => {
    const context = snapshot?.context ?? input;
    const records = snapshot?.records ?? [];
    const selectedStaff = selectedStaffId
      ? (records.find((record) => record.member.id === selectedStaffId) ?? null)
      : null;

    return {
      context,
      records,
      departments: snapshot?.departments ?? [],
      designations: snapshot?.designations ?? [],
      staffCount: snapshot?.staffCount ?? records.length,
      activeCount: snapshot?.activeCount ?? 0,
      onLeaveCount: snapshot?.onLeaveCount ?? 0,
      inactiveCount: snapshot?.inactiveCount ?? 0,
      pendingLeaveCount: snapshot?.pendingLeaveCount ?? 0,
      upcomingShiftCount: snapshot?.upcomingShiftCount ?? 0,
      avgAttendanceRateBps: snapshot?.avgAttendanceRateBps ?? 0,
      avgPerformanceScoreBps: snapshot?.avgPerformanceScoreBps ?? 0,
      selectedStaffId,
      selectedStaff,
      selectStaff: setSelectedStaffId,
      searchStaff: (query: StaffSearchQuery) => filterStaffRecords(records, query, context),
      refresh,
      isRefreshing,
      error,
    };
  }, [input, snapshot, selectedStaffId, refresh, isRefreshing, error]);

  return <StaffContext.Provider value={value}>{children}</StaffContext.Provider>;
}

function filterStaffRecords(
  records: StaffRecord[],
  query: StaffSearchQuery,
  context: StaffPlatformContext,
): StaffRecord[] {
  let results = [...records];

  const tenantId = query.tenantId ?? context.tenantId;
  const businessId = query.businessId ?? context.businessId;
  const branchId = query.branchId ?? context.branchId;

  results = results.filter(
    (record) =>
      record.member.tenantId === tenantId &&
      record.member.businessId === businessId &&
      record.branchAssignments.some((assignment) => assignment.branchId === branchId),
  );

  if (query.departmentId) {
    results = results.filter((record) => record.profile.departmentId === query.departmentId);
  }

  if (query.employmentStatus) {
    results = results.filter(
      (record) => record.member.employmentStatus === query.employmentStatus,
    );
  }

  if (query.departmentType) {
    results = results.filter((record) => record.department.departmentType === query.departmentType);
  }

  if (query.roleId) {
    results = results.filter((record) =>
      record.roleAssignments.some((assignment) => assignment.roleId === query.roleId),
    );
  }

  if (query.isActive !== undefined) {
    results = results.filter((record) => record.member.isActive === query.isActive);
  }

  if (query.query) {
    const term = query.query.toLowerCase();
    results = results.filter(
      (record) =>
        record.member.displayName.toLowerCase().includes(term) ||
        record.member.email.toLowerCase().includes(term) ||
        record.member.employeeNumber.toLowerCase().includes(term),
    );
  }

  if (query.limit) {
    results = results.slice(0, query.limit);
  }

  return results;
}

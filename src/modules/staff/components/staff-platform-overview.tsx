"use client";

import { EmploymentStatusBadge } from "@/modules/staff/components/employment-status-badge";
import { StaffManagementEmpty } from "@/modules/staff/components/staff-management-empty";
import { StaffManagementError } from "@/modules/staff/components/staff-management-error";
import { StaffManagementLoading } from "@/modules/staff/components/staff-management-loading";
import { useStaff } from "@/modules/staff/hooks/use-staff";

export function StaffPlatformOverview() {
  const {
    records,
    activeCount,
    onLeaveCount,
    pendingLeaveCount,
    upcomingShiftCount,
    avgAttendanceRateBps,
    avgPerformanceScoreBps,
    refresh,
    isRefreshing,
    error,
  } = useStaff();

  if (isRefreshing && records.length === 0) {
    return <StaffManagementLoading />;
  }

  if (error && records.length === 0) {
    return <StaffManagementError message={error} onRetry={refresh} />;
  }

  if (records.length === 0) {
    return <StaffManagementEmpty />;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <p className="text-muted-foreground text-sm">Total Staff</p>
          <p className="text-2xl font-semibold">{records.length}</p>
        </div>
        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <p className="text-muted-foreground text-sm">Active</p>
          <p className="text-2xl font-semibold">{activeCount}</p>
        </div>
        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <p className="text-muted-foreground text-sm">On Leave</p>
          <p className="text-2xl font-semibold">{onLeaveCount}</p>
        </div>
        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <p className="text-muted-foreground text-sm">Pending Leave</p>
          <p className="text-2xl font-semibold">{pendingLeaveCount}</p>
        </div>
        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <p className="text-muted-foreground text-sm">Upcoming Shifts</p>
          <p className="text-2xl font-semibold">{upcomingShiftCount}</p>
        </div>
        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <p className="text-muted-foreground text-sm">Avg Attendance</p>
          <p className="text-2xl font-semibold">{(avgAttendanceRateBps / 100).toFixed(0)}%</p>
        </div>
        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <p className="text-muted-foreground text-sm">Avg Performance</p>
          <p className="text-2xl font-semibold">{(avgPerformanceScoreBps / 100).toFixed(0)}%</p>
        </div>
        <div className="bg-card flex items-center rounded-xl border p-4 shadow-sm">
          <button
            type="button"
            className="text-primary text-sm font-medium"
            onClick={refresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold">Staff Directory</h3>
        <ul className="space-y-3">
          {records.slice(0, 20).map((record) => (
            <li
              key={record.member.id}
              className="flex items-center justify-between gap-4 text-sm"
            >
              <div>
                <p className="font-medium">{record.member.displayName}</p>
                <p className="text-muted-foreground text-xs">
                  {record.member.employeeNumber} · {record.department.name} ·{" "}
                  {record.designation.title}
                </p>
              </div>
              <EmploymentStatusBadge status={record.member.employmentStatus} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

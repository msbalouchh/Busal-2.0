"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HrAgentNav } from "@/modules/ai-hr-agent-management/components/hr-agent-nav";
import type {
  AttendanceSnapshot,
  LeavePatternItem,
} from "@/services/ai-hr-attendance-analysis.service";
import type { ShiftCoverageItem } from "@/services/ai-hr-shift-optimization.service";

interface HrAttendancePanelProps {
  attendance: AttendanceSnapshot;
  leavePatterns: LeavePatternItem[];
  shiftCoverage: ShiftCoverageItem[];
}

export function HrAttendancePanel({
  attendance,
  leavePatterns,
  shiftCoverage,
}: HrAttendancePanelProps) {
  return (
    <div className="space-y-8">
      <HrAgentNav />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Engagement rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{attendance.engagementRate}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">On leave</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{attendance.onLeave}</p>
            <p className="text-muted-foreground text-xs">{attendance.leaveRate}% of workforce</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Inactive logins</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{attendance.inactiveLogin}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Probation</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{attendance.probation}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Leave patterns</CardTitle>
          </CardHeader>
          <CardContent>
            {leavePatterns.length === 0 ? (
              <p className="text-muted-foreground text-sm">No leave patterns detected.</p>
            ) : (
              <ul className="space-y-2">
                {leavePatterns.map((item) => (
                  <li key={item.staffId} className="text-sm">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-muted-foreground">
                      {item.employmentStatus}
                      {item.daysSinceLogin !== null ? ` · ${item.daysSinceLogin}d since login` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Shift recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            {shiftCoverage.length === 0 ? (
              <p className="text-muted-foreground text-sm">No shift data available.</p>
            ) : (
              <ul className="space-y-2">
                {shiftCoverage.slice(0, 8).map((item) => (
                  <li
                    key={`${item.branchId}-${item.department}`}
                    className="rounded border p-3 text-sm"
                  >
                    <p className="font-medium">
                      {item.branchName} — {item.department}
                    </p>
                    <p className="text-muted-foreground">
                      {item.staffCount} staff · {item.recommendation}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

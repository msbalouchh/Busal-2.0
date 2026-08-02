import type { StaffAuditEntry } from "@/modules/staff/types/staff-management-types";
import type { RoleData, StaffData } from "@/services/staff-management.service";

interface StaffOverviewProps {
  members: StaffData[];
  roles: RoleData[];
  invitationCount: number;
  recentActivity: StaffAuditEntry[];
}

export function StaffOverview({
  members,
  roles,
  invitationCount,
  recentActivity,
}: StaffOverviewProps) {
  const activeMembers = members.filter((member) => member.isActive);

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <div className="rounded-lg border p-4">
        <p className="text-muted-foreground text-sm">Total staff</p>
        <p className="text-2xl font-semibold">{members.length}</p>
      </div>
      <div className="rounded-lg border p-4">
        <p className="text-muted-foreground text-sm">Active staff</p>
        <p className="text-2xl font-semibold">{activeMembers.length}</p>
      </div>
      <div className="rounded-lg border p-4">
        <p className="text-muted-foreground text-sm">Roles</p>
        <p className="text-2xl font-semibold">{roles.length}</p>
      </div>
      <div className="rounded-lg border p-4">
        <p className="text-muted-foreground text-sm">Pending invitations</p>
        <p className="text-2xl font-semibold">{invitationCount}</p>
      </div>
      <div className="rounded-lg border p-4 md:col-span-2 xl:col-span-4">
        <p className="mb-3 font-semibold">Recent activity</p>
        {recentActivity.length === 0 ? (
          <p className="text-muted-foreground text-sm">No recent staff activity.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {recentActivity.slice(0, 5).map((entry) => (
              <li key={entry.id}>
                <span className="font-medium">{entry.eventType.replaceAll("_", " ")}</span>
                <span className="text-muted-foreground">
                  {" "}
                  · {new Date(entry.createdAt).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

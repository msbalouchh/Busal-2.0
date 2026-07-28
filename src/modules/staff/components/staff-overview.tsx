import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RoleData, StaffData } from "@/services/staff-management.service";

interface StaffOverviewProps {
  members: StaffData[];
  roles: RoleData[];
}

export function StaffOverview({ members, roles }: StaffOverviewProps) {
  const activeMembers = members.filter((member) => member.isActive);
  const inactiveMembers = members.filter((member) => !member.isActive);
  const systemRoles = roles.filter((role) => role.isSystem);
  const customRoles = roles.filter((role) => !role.isSystem);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Team Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">Total members:</span> {members.length}
          </p>
          <p>
            <span className="text-muted-foreground">Active:</span> {activeMembers.length}
          </p>
          <p>
            <span className="text-muted-foreground">Inactive:</span> {inactiveMembers.length}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Roles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">System roles:</span> {systemRoles.length}
          </p>
          <p>
            <span className="text-muted-foreground">Custom roles:</span> {customRoles.length}
          </p>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Recent Members</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {members.length === 0 ? (
            <p className="text-muted-foreground">No staff members yet.</p>
          ) : (
            members.slice(0, 5).map((member) => (
              <p key={member.id}>
                <span className="font-medium">
                  {member.firstName} {member.lastName}
                </span>
                <span className="text-muted-foreground">
                  {" "}
                  — {member.roles[0]?.name ?? "No role"}
                  {member.branch ? ` · ${member.branch.name}` : ""}
                  {!member.isActive ? " · Inactive" : ""}
                </span>
              </p>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

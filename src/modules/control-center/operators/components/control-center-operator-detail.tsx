"use client";

import { ArrowLeft, KeyRound, Loader2, LogOut, Save } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { PageContainer } from "@/components/common/page-container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SectionHeader } from "@/modules/control-center/components/dashboard/section-header";
import { TenantActivityTimeline } from "@/modules/control-center/tenants/components/tenant-activity-timeline";
import { TenantConfirmDialog } from "@/modules/control-center/tenants/components/tenant-confirm-dialog";
import {
  activateControlCenterOperatorAction,
  assignControlCenterOperatorRoleAction,
  deleteControlCenterOperatorAction,
  forceLogoutControlCenterOperatorAction,
  manageControlCenterOperatorPermissionsAction,
  resetControlCenterOperatorPasswordAction,
  suspendControlCenterOperatorAction,
  updateControlCenterOperatorAction,
} from "@/modules/control-center/operators/actions/control-center-operator-actions";
import {
  OperatorStatusBadge,
  operatorStatusBadgeVariant,
} from "@/modules/control-center/operators/components/operator-status-badge";
import {
  CONTROL_CENTER_OPERATOR_ROUTES,
  OPERATOR_ROLE_LABELS,
  PLATFORM_OPERATOR_ROLES,
} from "@/modules/control-center/operators/constants/control-center-operators";
import type { ControlCenterOperatorDetailBundle } from "@/modules/control-center/operators/types/control-center-operators-types";
import type { PlatformOperatorRole } from "@/modules/control-center/operators/types/control-center-operators-types";

interface ControlCenterOperatorDetailProps {
  bundle: ControlCenterOperatorDetailBundle;
}

type ConfirmAction = "activate" | "suspend" | "delete" | "forceLogout" | "resetPassword" | null;

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(value),
  );
}

export function ControlCenterOperatorDetail({ bundle }: ControlCenterOperatorDetailProps) {
  const { profile, permissions } = bundle;
  const [isPending, startTransition] = useTransition();
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedRole, setSelectedRole] = useState(profile.role);
  const [permissionsInput, setPermissionsInput] = useState(profile.permissions.join("\n"));
  const [form, setForm] = useState({
    fullName: profile.fullName,
    department: profile.department ?? "",
  });

  const runConfirmAction = (action: Exclude<ConfirmAction, null>) => {
    startTransition(async () => {
      try {
        switch (action) {
          case "activate":
            await activateControlCenterOperatorAction(profile.id);
            toast.success("Operator activated");
            break;
          case "suspend":
            await suspendControlCenterOperatorAction(profile.id);
            toast.success("Operator suspended");
            break;
          case "delete":
            await deleteControlCenterOperatorAction(profile.id);
            toast.success("Operator deleted");
            break;
          case "forceLogout": {
            const count = await forceLogoutControlCenterOperatorAction(profile.id);
            toast.success(`${count} sessions revoked`);
            break;
          }
          case "resetPassword":
            await resetControlCenterOperatorPasswordAction(profile.id);
            toast.success("Password reset email sent");
            break;
        }
        setConfirmAction(null);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Action failed");
      }
    });
  };

  const handleSave = () => {
    startTransition(async () => {
      try {
        await updateControlCenterOperatorAction({
          operatorId: profile.id,
          fullName: form.fullName,
          department: form.department || null,
        });
        toast.success("Operator profile updated");
        setIsEditing(false);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to update operator");
      }
    });
  };

  const handleAssignRole = () => {
    startTransition(async () => {
      try {
        await assignControlCenterOperatorRoleAction({
          operatorId: profile.id,
          role: selectedRole,
        });
        toast.success("Role assigned");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to assign role");
      }
    });
  };

  const handleManagePermissions = () => {
    const permissionsList = permissionsInput
      .split("\n")
      .map((entry) => entry.trim())
      .filter(Boolean);

    startTransition(async () => {
      try {
        await manageControlCenterOperatorPermissionsAction({
          operatorId: profile.id,
          permissions: permissionsList,
        });
        toast.success("Permissions updated");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to update permissions");
      }
    });
  };

  const roleOptions: PlatformOperatorRole[] = permissions.isPlatformOwner
    ? [...PLATFORM_OPERATOR_ROLES]
    : PLATFORM_OPERATOR_ROLES.filter((entry) => entry !== "PLATFORM_OWNER");

  return (
    <PageContainer>
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="outline" size="sm">
          <Link href={CONTROL_CENTER_OPERATOR_ROUTES.directory}>
            <ArrowLeft className="h-4 w-4" />
            Back to directory
          </Link>
        </Button>
        <div className="flex flex-wrap gap-2">
          <OperatorStatusBadge label={OPERATOR_ROLE_LABELS[profile.role]} />
          <OperatorStatusBadge
            label={profile.status}
            variant={operatorStatusBadgeVariant(profile.status)}
          />
          <OperatorStatusBadge label={profile.mfaEnabled ? "MFA enabled" : "MFA disabled"} />
        </div>
      </div>

      <SectionHeader
        title={profile.fullName}
        description="Operator profile, permissions, sessions, and audit history."
        action={
          permissions.canEdit ? (
            <Button
              variant={isEditing ? "default" : "outline"}
              size="sm"
              onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isEditing ? "Save changes" : "Edit profile"}
            </Button>
          ) : null
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{profile.activeSessions}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Permissions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{profile.permissions.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">MFA</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{profile.mfaEnabled ? "On" : "Off"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Last Login</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">{formatDate(profile.lastLoginAt)}</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Operator Profile</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {isEditing ? (
              <>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="operator-name">Full name</Label>
                  <Input
                    id="operator-name"
                    value={form.fullName}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, fullName: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="operator-department">Department</Label>
                  <Input
                    id="operator-department"
                    value={form.department}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, department: event.target.value }))
                    }
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <p className="text-muted-foreground text-xs uppercase">Operator ID</p>
                  <p className="text-sm font-medium">{profile.id}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase">User ID</p>
                  <p className="text-sm font-medium">{profile.userId}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase">Email</p>
                  <p className="text-sm font-medium">{profile.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase">Department</p>
                  <p className="text-sm font-medium">{profile.department ?? "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase">Created</p>
                  <p className="text-sm font-medium">{formatDate(profile.createdAt)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase">Updated</p>
                  <p className="text-sm font-medium">{formatDate(profile.updatedAt)}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Permission Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {profile.permissions.length > 0 ? (
                profile.permissions.map((permission) => (
                  <OperatorStatusBadge key={permission} label={permission} />
                ))
              ) : (
                <p className="text-muted-foreground text-sm">No permissions assigned</p>
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      {permissions.canAssignRole ? (
        <Card>
          <CardHeader>
            <CardTitle>Assign Role</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <select
              value={selectedRole}
              onChange={(event) => setSelectedRole(event.target.value as PlatformOperatorRole)}
              className="border-input bg-background h-10 min-w-48 rounded-md border px-3 text-sm"
            >
              {roleOptions.map((role) => (
                <option key={role} value={role}>
                  {OPERATOR_ROLE_LABELS[role]}
                </option>
              ))}
            </select>
            <Button variant="outline" onClick={handleAssignRole} disabled={isPending}>
              Assign role
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {permissions.canManagePermissions ? (
        <Card>
          <CardHeader>
            <CardTitle>Manage Permissions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Label htmlFor="permissions-input">One permission code per line</Label>
            <textarea
              id="permissions-input"
              value={permissionsInput}
              onChange={(event) => setPermissionsInput(event.target.value)}
              className="border-input bg-background min-h-40 w-full rounded-md border p-3 text-sm"
            />
            <Button variant="outline" onClick={handleManagePermissions} disabled={isPending}>
              Save permissions
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          {profile.sessions.length === 0 ? (
            <p className="text-muted-foreground text-sm">No sessions recorded.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device</TableHead>
                  <TableHead>Browser</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Last activity</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profile.sessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell>{session.deviceName ?? "—"}</TableCell>
                    <TableCell>{session.browser ?? "—"}</TableCell>
                    <TableCell>{session.ipAddress ?? "—"}</TableCell>
                    <TableCell>{formatDate(session.lastActivityAt)}</TableCell>
                    <TableCell>{session.isActive ? "Active" : "Revoked"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Activity Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <TenantActivityTimeline
              items={profile.activities.map((item) => ({
                id: item.id,
                eventType: String(item.eventType),
                title: item.title,
                description: item.description,
                createdAt: item.createdAt,
              }))}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Audit Log</CardTitle>
          </CardHeader>
          <CardContent>
            {profile.auditLogs.length === 0 ? (
              <p className="text-muted-foreground text-sm">No audit entries found.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profile.auditLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{log.eventType}</TableCell>
                      <TableCell>{log.actorEmail ?? "—"}</TableCell>
                      <TableCell>{formatDate(log.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </section>

      {(permissions.canEdit ||
        permissions.canSuspend ||
        permissions.canDelete ||
        permissions.canResetPassword ||
        permissions.canForceLogout) && (
        <section className="flex flex-wrap gap-2 rounded-lg border p-4">
          {permissions.canActivate && profile.status !== "active" ? (
            <Button variant="outline" onClick={() => setConfirmAction("activate")}>
              Activate
            </Button>
          ) : null}
          {permissions.canSuspend && profile.status === "active" ? (
            <Button variant="outline" onClick={() => setConfirmAction("suspend")}>
              Suspend
            </Button>
          ) : null}
          {permissions.canResetPassword ? (
            <Button variant="outline" onClick={() => setConfirmAction("resetPassword")}>
              <KeyRound className="h-4 w-4" />
              Reset Password
            </Button>
          ) : null}
          {permissions.canForceLogout ? (
            <Button variant="outline" onClick={() => setConfirmAction("forceLogout")}>
              <LogOut className="h-4 w-4" />
              Force Logout
            </Button>
          ) : null}
          {permissions.canDelete ? (
            <Button variant="destructive" onClick={() => setConfirmAction("delete")}>
              Delete
            </Button>
          ) : null}
        </section>
      )}

      <TenantConfirmDialog
        open={Boolean(confirmAction)}
        title={`Confirm ${confirmAction}`}
        description={`Are you sure you want to ${confirmAction?.replace(/([A-Z])/g, " $1").toLowerCase()} for this operator?`}
        confirmLabel={confirmAction ?? "Confirm"}
        destructive={
          confirmAction === "suspend" ||
          confirmAction === "delete" ||
          confirmAction === "forceLogout"
        }
        loading={isPending}
        onConfirm={() => {
          if (confirmAction) runConfirmAction(confirmAction);
        }}
        onOpenChange={(open) => {
          if (!open) setConfirmAction(null);
        }}
      />
    </PageContainer>
  );
}

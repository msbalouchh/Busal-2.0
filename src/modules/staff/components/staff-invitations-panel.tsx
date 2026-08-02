"use client";

import { Loader2, Mail, RefreshCcw, XCircle } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  cancelStaffInvitationAction,
  inviteStaffAction,
  resendStaffInvitationAction,
} from "@/modules/staff/actions/staff-management-actions";
import { StaffEmptyState } from "@/modules/staff/components/staff-empty-state";
import type {
  StaffInvitationData,
  StaffManagementPermissions,
} from "@/modules/staff/types/staff-management-types";
import type { BranchData, RoleData } from "@/services/staff-management.service";
import { cn } from "@/lib/utils";

interface StaffInvitationsPanelProps {
  invitations: StaffInvitationData[];
  roles: RoleData[];
  branches: BranchData[];
  permissions: StaffManagementPermissions;
}

export function StaffInvitationsPanel({
  invitations,
  roles,
  branches,
  permissions,
}: StaffInvitationsPanelProps) {
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState("");
  const [branchId, setBranchId] = useState("");

  const handleInvite = () => {
    if (!email.trim()) {
      toast.error("Email is required");
      return;
    }

    startTransition(async () => {
      try {
        await inviteStaffAction({
          email: email.trim(),
          roleId: roleId || null,
          branchIds: branchId ? [branchId] : [],
          defaultBranchId: branchId || null,
        });
        toast.success("Invitation sent");
        setEmail("");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to send invitation");
      }
    });
  };

  const handleResend = (invitationId: string) => {
    startTransition(async () => {
      try {
        await resendStaffInvitationAction(invitationId);
        toast.success("Invitation resent");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to resend invitation");
      }
    });
  };

  const handleCancel = (invitationId: string) => {
    startTransition(async () => {
      try {
        await cancelStaffInvitationAction(invitationId);
        toast.success("Invitation cancelled");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to cancel invitation");
      }
    });
  };

  return (
    <div className="space-y-8">
      {permissions.canInvite ? (
        <section className="space-y-4 rounded-lg border p-4" aria-labelledby="invite-staff-heading">
          <h2 id="invite-staff-heading" className="text-lg font-semibold">
            Invite staff
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="invite-email">Email</Label>
              <Input
                id="invite-email"
                type="email"
                value={email}
                disabled={isPending}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-role">Role</Label>
              <select
                id="invite-role"
                value={roleId}
                disabled={isPending}
                className={cn(
                  "border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm shadow-sm",
                )}
                onChange={(event) => setRoleId(event.target.value)}
              >
                <option value="">Select role</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-branch">Branch</Label>
              <select
                id="invite-branch"
                value={branchId}
                disabled={isPending}
                className={cn(
                  "border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm shadow-sm",
                )}
                onChange={(event) => setBranchId(event.target.value)}
              >
                <option value="">Select branch</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <Button type="button" disabled={isPending} onClick={handleInvite}>
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Mail className="h-4 w-4" />
            )}
            Send invitation
          </Button>
        </section>
      ) : null}

      <section className="space-y-4" aria-labelledby="invitations-list-heading">
        <h2 id="invitations-list-heading" className="text-lg font-semibold">
          Invitations
        </h2>
        {invitations.length === 0 ? (
          <StaffEmptyState
            title="No invitations yet"
            description="Invite team members by email to join your business workspace."
          />
        ) : (
          <div className="space-y-3">
            {invitations.map((invitation) => (
              <div
                key={invitation.id}
                className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-1 text-sm">
                  <p className="font-semibold">{invitation.email}</p>
                  <p className="text-muted-foreground">
                    {invitation.roleName ?? "No role"} · {invitation.status}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Expires {new Date(invitation.expiresAt).toLocaleDateString()}
                  </p>
                </div>
                {invitation.status === "PENDING" && permissions.canInvite ? (
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isPending}
                      onClick={() => handleResend(invitation.id)}
                    >
                      <RefreshCcw className="h-4 w-4" />
                      Resend
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isPending}
                      onClick={() => handleCancel(invitation.id)}
                    >
                      <XCircle className="h-4 w-4" />
                      Cancel
                    </Button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

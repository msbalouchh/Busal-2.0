"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  activateModifierManagementAction,
  archiveModifierManagementAction,
  deleteModifierManagementAction,
  duplicateModifierManagementAction,
  restoreModifierManagementAction,
} from "@/modules/modifier-management/actions/modifier-management-actions";
import { ModifierOptionList } from "@/modules/modifier-management/components/modifier-option-list";
import { ModifierPreviewPanel } from "@/modules/modifier-management/components/modifier-preview-panel";
import { ModifierStatusBadge } from "@/modules/modifier-management/components/modifier-status-badge";
import { MODIFIER_MANAGEMENT_ROUTES } from "@/modules/modifier-management/constants/routes";
import type { ModifierManagementContext } from "@/modules/modifier-management/lib/get-modifier-management-context";
import type { ModifierManagementRecord } from "@/modules/modifier-management/types/modifier-management-types";

interface ModifierDetailsPanelProps {
  context: ModifierManagementContext;
  modifierGroup: ModifierManagementRecord;
}

export function ModifierDetailsPanel({ context, modifierGroup }: ModifierDetailsPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const menuId = context.menu.id;

  const runAction = (
    action: () => Promise<unknown>,
    successMessage: string,
    redirectToList = false,
  ) => {
    startTransition(async () => {
      try {
        await action();
        toast.success(successMessage);
        if (redirectToList) {
          router.push(MODIFIER_MANAGEMENT_ROUTES.list(menuId));
        } else {
          router.refresh();
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Action failed");
      }
    });
  };

  return (
    <div className="space-y-6">
      <section className="rounded-xl border p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-muted-foreground text-sm capitalize">
              {modifierGroup.selectionType.toLowerCase()} selection
            </p>
            <h2 className="text-2xl font-semibold tracking-tight">{modifierGroup.name}</h2>
            <div className="mt-2">
              <ModifierStatusBadge
                status={modifierGroup.status}
                isRequired={modifierGroup.isRequired}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {context.permissionsFlags.canUpdate && modifierGroup.status !== "ARCHIVED" ? (
              <Button asChild variant="outline">
                <Link href={MODIFIER_MANAGEMENT_ROUTES.edit(menuId, modifierGroup.id)}>
                  Edit group
                </Link>
              </Button>
            ) : null}
            {context.permissionsFlags.canCreate ? (
              <Button
                variant="outline"
                disabled={isPending}
                onClick={() =>
                  runAction(
                    () => duplicateModifierManagementAction(menuId, modifierGroup.id),
                    "Modifier group duplicated",
                  )
                }
              >
                Duplicate
              </Button>
            ) : null}
            {context.permissionsFlags.canUpdate &&
            modifierGroup.status !== "ACTIVE" &&
            modifierGroup.status !== "ARCHIVED" ? (
              <Button
                disabled={isPending}
                onClick={() =>
                  runAction(
                    () => activateModifierManagementAction(menuId, modifierGroup.id),
                    "Modifier group activated",
                  )
                }
              >
                Activate
              </Button>
            ) : null}
            {context.permissionsFlags.canDelete && modifierGroup.status !== "ARCHIVED" ? (
              <Button
                variant="destructive"
                disabled={isPending}
                onClick={() =>
                  runAction(
                    () => archiveModifierManagementAction(menuId, modifierGroup.id),
                    "Modifier group archived",
                  )
                }
              >
                Archive
              </Button>
            ) : null}
            {context.permissionsFlags.canUpdate && modifierGroup.status === "ARCHIVED" ? (
              <Button
                variant="outline"
                disabled={isPending}
                onClick={() =>
                  runAction(
                    () => restoreModifierManagementAction(menuId, modifierGroup.id),
                    "Modifier group restored",
                  )
                }
              >
                Restore
              </Button>
            ) : null}
            {context.permissionsFlags.canDelete ? (
              <Button
                variant="ghost"
                disabled={isPending}
                onClick={() =>
                  runAction(
                    () => deleteModifierManagementAction(menuId, modifierGroup.id),
                    "Modifier group deleted",
                    true,
                  )
                }
              >
                Delete
              </Button>
            ) : null}
          </div>
        </div>

        {modifierGroup.description ? (
          <p className="text-muted-foreground mt-4 text-sm">{modifierGroup.description}</p>
        ) : null}

        <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-muted-foreground text-sm">Min selection</dt>
            <dd className="font-medium">{modifierGroup.minimumSelection}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-sm">Max selection</dt>
            <dd className="font-medium">{modifierGroup.maximumSelection}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-sm">Options</dt>
            <dd className="font-medium">{modifierGroup.optionCount}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-sm">Assigned products</dt>
            <dd className="font-medium">{modifierGroup.assignedProductCount}</dd>
          </div>
        </dl>
      </section>

      <ModifierOptionList
        menuId={menuId}
        modifierGroup={modifierGroup}
        canUpdate={context.permissionsFlags.canUpdate}
      />

      <ModifierPreviewPanel modifierGroup={modifierGroup} />
    </div>
  );
}

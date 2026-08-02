import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ModifierStatusBadge } from "@/modules/modifier-management/components/modifier-status-badge";
import { MODIFIER_MANAGEMENT_ROUTES } from "@/modules/modifier-management/constants/routes";
import type { ModifierManagementRecord } from "@/modules/modifier-management/types/modifier-management-types";

interface ModifierCardProps {
  menuId: string;
  modifierGroup: ModifierManagementRecord;
}

function getSelectionLabel(modifierGroup: ModifierManagementRecord): string {
  const type = modifierGroup.selectionType === "SINGLE" ? "Single" : "Multiple";
  return `${type} · ${modifierGroup.minimumSelection}-${modifierGroup.maximumSelection} selections`;
}

export function ModifierCard({ menuId, modifierGroup }: ModifierCardProps) {
  return (
    <Link
      href={MODIFIER_MANAGEMENT_ROUTES.details(menuId, modifierGroup.id)}
      className="group block h-full"
    >
      <Card className="flex h-full flex-col rounded-xl shadow-sm transition-shadow group-hover:shadow-md">
        <CardHeader className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base">{modifierGroup.name}</CardTitle>
              <CardDescription>{getSelectionLabel(modifierGroup)}</CardDescription>
            </div>
            <ModifierStatusBadge
              status={modifierGroup.status}
              isRequired={modifierGroup.isRequired}
            />
          </div>
        </CardHeader>
        <CardContent className="mt-auto space-y-2 text-sm">
          <p className="text-muted-foreground">
            {modifierGroup.optionCount} option{modifierGroup.optionCount === 1 ? "" : "s"}
          </p>
          <p className="text-muted-foreground">
            Assigned to {modifierGroup.assignedProductCount} product
            {modifierGroup.assignedProductCount === 1 ? "" : "s"}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}

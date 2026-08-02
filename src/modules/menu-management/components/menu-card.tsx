import Link from "next/link";
import { Clock, MapPin } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MenuStatusBadge } from "@/modules/menu-management/components/menu-status-badge";
import {
  MENU_MANAGEMENT_ROUTES,
  MENU_TYPE_FILTER_OPTIONS,
} from "@/modules/menu-management/constants/routes";
import type { MenuManagementRecord } from "@/modules/menu-management/types/menu-management-types";

interface MenuCardProps {
  menu: MenuManagementRecord;
}

function getMenuTypeLabel(menuType: MenuManagementRecord["menuType"]): string {
  return MENU_TYPE_FILTER_OPTIONS.find((option) => option.value === menuType)?.label ?? menuType;
}

export function MenuCard({ menu }: MenuCardProps) {
  return (
    <Link href={MENU_MANAGEMENT_ROUTES.details(menu.id)} className="group block h-full">
      <Card className="flex h-full flex-col overflow-hidden rounded-xl shadow-sm transition-shadow group-hover:shadow-md">
        {menu.image ? (
          <div
            className="bg-muted h-36 bg-cover bg-center"
            style={{ backgroundImage: `url(${menu.image})` }}
            role="img"
            aria-label={`${menu.name} cover`}
          />
        ) : (
          <div className="bg-muted flex h-36 items-center justify-center">
            <span className="text-muted-foreground text-sm">No image</span>
          </div>
        )}
        <CardHeader className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base">{menu.name}</CardTitle>
              <CardDescription>{getMenuTypeLabel(menu.menuType)}</CardDescription>
            </div>
            <MenuStatusBadge status={menu.status} isDefault={menu.isDefault} />
          </div>
        </CardHeader>
        <CardContent className="mt-auto space-y-2 text-sm">
          {menu.description ? (
            <p className="text-muted-foreground line-clamp-2">{menu.description}</p>
          ) : null}
          <div className="text-muted-foreground flex flex-wrap items-center gap-3">
            {menu.branchName ? (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                {menu.branchName}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                All branches
              </span>
            )}
            {menu.availableFrom && menu.availableUntil ? (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                {menu.availableFrom}–{menu.availableUntil}
              </span>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

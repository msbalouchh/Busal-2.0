import {
  MENU_DAY_OPTIONS,
  MENU_TYPE_FILTER_OPTIONS,
} from "@/modules/menu-management/constants/routes";
import type { MenuManagementRecord } from "@/modules/menu-management/types/menu-management-types";
import { MenuStatusBadge } from "@/modules/menu-management/components/menu-status-badge";

interface MenuPreviewPanelProps {
  menu: MenuManagementRecord;
}

function getMenuTypeLabel(menuType: MenuManagementRecord["menuType"]): string {
  return MENU_TYPE_FILTER_OPTIONS.find((option) => option.value === menuType)?.label ?? menuType;
}

function formatDays(days: number[]): string {
  if (days.length === 7) {
    return "Every day";
  }

  return days
    .map((day) => MENU_DAY_OPTIONS.find((option) => option.value === day)?.label ?? String(day))
    .join(", ");
}

export function MenuPreviewPanel({ menu }: MenuPreviewPanelProps) {
  return (
    <section className="overflow-hidden rounded-xl border">
      {menu.image ? (
        <div
          className="bg-muted h-48 bg-cover bg-center"
          style={{ backgroundImage: `url(${menu.image})` }}
          role="img"
          aria-label={`${menu.name} preview`}
        />
      ) : (
        <div className="bg-muted flex h-48 items-center justify-center">
          <span className="text-muted-foreground text-sm">Menu preview</span>
        </div>
      )}
      <div className="space-y-4 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-muted-foreground text-sm">{getMenuTypeLabel(menu.menuType)}</p>
            <h3 className="text-2xl font-semibold tracking-tight">{menu.name}</h3>
          </div>
          <MenuStatusBadge status={menu.status} isDefault={menu.isDefault} />
        </div>
        {menu.description ? (
          <p className="text-muted-foreground text-sm">{menu.description}</p>
        ) : null}
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Primary branch</dt>
            <dd>{menu.branchName ?? "Business-wide"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Availability window</dt>
            <dd>
              {menu.availableFrom && menu.availableUntil
                ? `${menu.availableFrom} – ${menu.availableUntil}`
                : "All day"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Days available</dt>
            <dd>{formatDays(menu.daysAvailable)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Assigned branches</dt>
            <dd>
              {menu.branchAssignments.length > 0
                ? menu.branchAssignments.map((entry) => entry.branchName).join(", ")
                : "None yet"}
            </dd>
          </div>
        </dl>
        <p className="text-muted-foreground text-xs">
          Product categories and items will appear here in a later release.
        </p>
      </div>
    </section>
  );
}

"use client";

import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FloorStatusBadge } from "@/modules/floor-table-management/components/floor-status-badge";
import { FLOOR_TABLE_MANAGEMENT_ROUTES } from "@/modules/floor-table-management/constants/routes";
import type { FloorManagementRecord } from "@/modules/floor-table-management/types/floor-table-management-types";

interface FloorCardProps {
  branchId: string;
  floor: FloorManagementRecord;
}

export function FloorCard({ branchId, floor }: FloorCardProps) {
  return (
    <Link
      href={FLOOR_TABLE_MANAGEMENT_ROUTES.floorDetails(floor.id, branchId)}
      className="group block h-full"
    >
      <Card className="flex h-full flex-col rounded-xl shadow-sm transition-shadow group-hover:shadow-md">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base">{floor.name}</CardTitle>
              <CardDescription>{floor.tableCount} tables</CardDescription>
            </div>
            <FloorStatusBadge status={floor.status} />
          </div>
        </CardHeader>
        {floor.description ? (
          <CardContent>
            <p className="text-muted-foreground line-clamp-2 text-sm">{floor.description}</p>
          </CardContent>
        ) : null}
      </Card>
    </Link>
  );
}

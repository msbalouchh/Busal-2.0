"use client";

import { Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveBusinessHoursAction } from "@/modules/business/actions/business-actions";
import { WEEKDAYS } from "@/modules/business/constants/routes";
import type { BusinessHoursData } from "@/services/business-management.service";

interface BusinessHoursEditorProps {
  hours: BusinessHoursData[];
}

export function BusinessHoursEditor({ hours }: BusinessHoursEditorProps) {
  const [isPending, startTransition] = useTransition();
  const [entries, setEntries] = useState(
    WEEKDAYS.map((day) => {
      const existing = hours.find((entry) => entry.dayOfWeek === day.value);

      return {
        dayOfWeek: day.value,
        label: day.label,
        openTime: existing?.openTime ?? "09:00",
        closeTime: existing?.closeTime ?? "17:00",
        isClosed: existing?.isClosed ?? (day.value === 0 || day.value === 6),
      };
    }),
  );

  const updateEntry = (
    dayOfWeek: number,
    patch: Partial<{ openTime: string; closeTime: string; isClosed: boolean }>,
  ) => {
    setEntries((current) =>
      current.map((entry) => (entry.dayOfWeek === dayOfWeek ? { ...entry, ...patch } : entry)),
    );
  };

  const handleSave = () => {
    startTransition(async () => {
      try {
        await saveBusinessHoursAction(
          entries.map((entry) => ({
            dayOfWeek: entry.dayOfWeek,
            openTime: entry.openTime,
            closeTime: entry.closeTime,
            isClosed: entry.isClosed,
          })),
        );
        toast.success("Business hours saved");
      } catch {
        toast.error("Unable to save business hours");
      }
    });
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="space-y-4">
        {entries.map((entry) => (
          <div
            key={entry.dayOfWeek}
            className="grid gap-3 rounded-lg border p-4 sm:grid-cols-[120px_1fr_1fr_auto] sm:items-end"
          >
            <p className="text-sm font-medium">{entry.label}</p>
            <div className="space-y-2">
              <Label htmlFor={`open-${entry.dayOfWeek}`}>Open</Label>
              <Input
                id={`open-${entry.dayOfWeek}`}
                type="time"
                value={entry.openTime}
                disabled={isPending || entry.isClosed}
                onChange={(event) => updateEntry(entry.dayOfWeek, { openTime: event.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`close-${entry.dayOfWeek}`}>Close</Label>
              <Input
                id={`close-${entry.dayOfWeek}`}
                type="time"
                value={entry.closeTime}
                disabled={isPending || entry.isClosed}
                onChange={(event) =>
                  updateEntry(entry.dayOfWeek, { closeTime: event.target.value })
                }
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={entry.isClosed}
                disabled={isPending}
                onChange={(event) =>
                  updateEntry(entry.dayOfWeek, { isClosed: event.target.checked })
                }
              />
              Closed
            </label>
          </div>
        ))}
      </div>

      <Button type="button" onClick={handleSave} disabled={isPending}>
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Save hours
      </Button>
    </div>
  );
}

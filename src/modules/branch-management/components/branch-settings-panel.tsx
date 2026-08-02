"use client";

import { Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { saveBranchSettingsManagementAction } from "@/modules/branch-management/actions/branch-management-actions";
import type { BranchManagementRecord } from "@/modules/branch-management/types/branch-management-types";

interface BranchSettingsPanelProps {
  branch: BranchManagementRecord;
  canEdit: boolean;
}

export function BranchSettingsPanel({ branch, canEdit }: BranchSettingsPanelProps) {
  const [isPending, startTransition] = useTransition();
  const [settingsJson, setSettingsJson] = useState(JSON.stringify(branch.settings ?? {}, null, 2));

  const handleSave = () => {
    startTransition(async () => {
      try {
        const parsed = JSON.parse(settingsJson) as Record<string, unknown>;
        await saveBranchSettingsManagementAction(branch.id, { settings: parsed });
        toast.success("Branch settings saved");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to save branch settings");
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="branch-settings-json">Branch settings (JSON)</Label>
        <textarea
          id="branch-settings-json"
          value={settingsJson}
          onChange={(event) => setSettingsJson(event.target.value)}
          disabled={!canEdit || isPending}
          rows={16}
          aria-label="Branch settings JSON"
          className="border-input bg-background focus-visible:ring-ring w-full rounded-md border px-3 py-2 font-mono text-sm focus-visible:ring-2 focus-visible:outline-none"
        />
        <p className="text-muted-foreground text-sm">
          Module-specific branch settings will be stored here for Restaurant, Salon, Clinic, and
          future industry modules.
        </p>
      </div>
      {canEdit ? (
        <Button type="button" onClick={handleSave} disabled={isPending}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
          Save settings
        </Button>
      ) : (
        <p className="text-muted-foreground text-sm">
          You have view-only access to branch settings.
        </p>
      )}
    </div>
  );
}

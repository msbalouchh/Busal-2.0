"use client";

import { useState, useTransition } from "react";

import { updateAiPlatformSettingAction } from "@/modules/ai-platform/actions/ai-platform-actions";
import type {
  AiPlatformPermissions,
  AiSettingValue,
} from "@/modules/ai-platform/types/ai-platform-types";

interface AiSettingsPanelProps {
  permissions: AiPlatformPermissions;
  settings: AiSettingValue[];
}

export function AiSettingsPanel({ permissions, settings }: AiSettingsPanelProps) {
  const [values, setValues] = useState<Record<string, unknown>>(() =>
    Object.fromEntries(settings.map((setting) => [setting.key, setting.value])),
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!permissions.canViewSettings) {
    return (
      <p className="text-muted-foreground text-sm">
        You do not have permission to view AI settings.
      </p>
    );
  }

  const handleSave = (key: string) => {
    setMessage(null);
    setError(null);

    startTransition(async () => {
      try {
        await updateAiPlatformSettingAction({ key, value: values[key] });
        setMessage("Settings saved successfully.");
      } catch (saveError) {
        setError(saveError instanceof Error ? saveError.message : "Failed to save setting");
      }
    });
  };

  return (
    <div className="space-y-6">
      {!permissions.canManageSettings ? (
        <p className="text-muted-foreground rounded-lg border p-4 text-sm">
          You can view AI settings but need Settings Edit permission to change them.
        </p>
      ) : null}

      {message ? (
        <p className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          {message}
        </p>
      ) : null}

      {error ? (
        <p className="text-destructive rounded-lg border p-3 text-sm" role="alert">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4">
        {settings.map((setting) => (
          <div key={setting.key} className="rounded-lg border p-4">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-medium capitalize">{setting.label}</h2>
                {setting.helpText ? (
                  <p className="text-muted-foreground text-sm">{setting.helpText}</p>
                ) : null}
              </div>
              {permissions.canManageSettings ? (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleSave(setting.key)}
                  className="bg-primary text-primary-foreground rounded-md px-3 py-2 text-sm disabled:opacity-50"
                >
                  Save
                </button>
              ) : null}
            </div>

            {setting.valueType === "BOOLEAN" ? (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={Boolean(values[setting.key])}
                  disabled={!permissions.canManageSettings || isPending}
                  onChange={(event) =>
                    setValues((current) => ({ ...current, [setting.key]: event.target.checked }))
                  }
                />
                Enabled
              </label>
            ) : setting.valueType === "ENUM" && setting.allowedValues ? (
              <select
                className="bg-background w-full max-w-md rounded-md border px-3 py-2 text-sm"
                value={String(values[setting.key] ?? "")}
                disabled={!permissions.canManageSettings || isPending}
                onChange={(event) =>
                  setValues((current) => ({ ...current, [setting.key]: event.target.value }))
                }
              >
                {setting.allowedValues.map((option) => (
                  <option key={String(option)} value={String(option)}>
                    {String(option)}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={setting.valueType === "NUMBER" ? "number" : "text"}
                className="bg-background w-full max-w-md rounded-md border px-3 py-2 text-sm"
                value={String(values[setting.key] ?? "")}
                min={setting.minValue}
                max={setting.maxValue}
                disabled={!permissions.canManageSettings || isPending}
                onChange={(event) => {
                  const nextValue =
                    setting.valueType === "NUMBER"
                      ? Number(event.target.value)
                      : event.target.value;
                  setValues((current) => ({ ...current, [setting.key]: nextValue }));
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

import { Download, History, Loader2, RefreshCw, RotateCcw, Save, Search, Upload } from "lucide-react";
import { useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { PageContainer } from "@/components/common/page-container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ControlCenterEmptyState } from "@/modules/control-center/components/dashboard/empty-state";
import { ControlCenterErrorState } from "@/modules/control-center/components/dashboard/error-state";
import { SectionHeader } from "@/modules/control-center/components/dashboard/section-header";
import { TenantConfirmDialog } from "@/modules/control-center/tenants/components/tenant-confirm-dialog";
import {
  exportControlCenterPlatformSettingsAction,
  getControlCenterPlatformSettingHistoryAction,
  importControlCenterPlatformSettingsAction,
  refreshControlCenterPlatformSettingsAction,
  resetControlCenterPlatformSettingAction,
  updateControlCenterPlatformSettingAction,
} from "@/modules/control-center/settings/actions/control-center-platform-settings-actions";
import { PLATFORM_SETTINGS_GROUPS } from "@/modules/control-center/settings/constants/control-center-platform-settings";
import type {
  ControlCenterPlatformSettingField,
  ControlCenterPlatformSettingHistoryItem,
  ControlCenterPlatformSettingsBundle,
} from "@/modules/control-center/settings/types/control-center-platform-settings-types";

interface ControlCenterPlatformSettingsHubProps {
  initialBundle: ControlCenterPlatformSettingsBundle;
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(value),
  );
}

function serializeFieldValue(field: ControlCenterPlatformSettingField): string {
  if (typeof field.value === "object") {
    return JSON.stringify(field.value, null, 2);
  }
  return String(field.value ?? "");
}

function parseFieldValue(field: ControlCenterPlatformSettingField, raw: string): unknown {
  if (field.valueType === "BOOLEAN") {
    return raw === "true";
  }
  if (field.valueType === "NUMBER") {
    return Number(raw);
  }
  if (field.valueType === "JSON") {
    return JSON.parse(raw);
  }
  return raw;
}

export function ControlCenterPlatformSettingsHub({
  initialBundle,
}: ControlCenterPlatformSettingsHubProps) {
  const [isPending, startTransition] = useTransition();
  const [bundle, setBundle] = useState(initialBundle);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeGroup, setActiveGroup] = useState<string>(PLATFORM_SETTINGS_GROUPS[0]?.id ?? "general");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [resetKey, setResetKey] = useState<string | null>(null);
  const [historyKey, setHistoryKey] = useState<string | null>(null);
  const [historyItems, setHistoryItems] = useState<ControlCenterPlatformSettingHistoryItem[]>([]);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { permissions } = bundle;

  const visibleGroups = useMemo(() => {
    const term = search.trim().toLowerCase();
    return bundle.groups
      .map((group) => ({
        ...group,
        settings: group.settings.filter((setting) => {
          if (!term) return true;
          return (
            setting.key.toLowerCase().includes(term) ||
            setting.label.toLowerCase().includes(term) ||
            (setting.helpText?.toLowerCase().includes(term) ?? false)
          );
        }),
      }))
      .filter((group) => group.settings.length > 0);
  }, [bundle.groups, search]);

  const activeGroupData =
    visibleGroups.find((group) => group.id === activeGroup) ?? visibleGroups[0] ?? null;

  const refresh = () => {
    startTransition(async () => {
      try {
        setError(null);
        const next = await refreshControlCenterPlatformSettingsAction({
          search: search || undefined,
          groupId: activeGroup,
        });
        setBundle(next);
        setDrafts({});
      } catch (refreshError) {
        setError(refreshError instanceof Error ? refreshError.message : "Unable to load settings");
      }
    });
  };

  const handleSave = (field: ControlCenterPlatformSettingField) => {
    const raw = drafts[field.key] ?? serializeFieldValue(field);

    startTransition(async () => {
      try {
        const value = parseFieldValue(field, raw);
        await updateControlCenterPlatformSettingAction({
          key: field.key,
          value,
          changeReason: `Updated ${field.label}`,
        });
        toast.success(`${field.label} saved`);
        setDrafts((current) => {
          const next = { ...current };
          delete next[field.key];
          return next;
        });
        refresh();
      } catch (saveError) {
        toast.error(saveError instanceof Error ? saveError.message : "Save failed");
      }
    });
  };

  const handleReset = () => {
    if (!resetKey) return;

    startTransition(async () => {
      try {
        await resetControlCenterPlatformSettingAction({
          key: resetKey,
          changeReason: "Reset from Control Center",
        });
        toast.success("Setting reset to default");
        setResetKey(null);
        refresh();
      } catch (resetError) {
        toast.error(resetError instanceof Error ? resetError.message : "Reset failed");
      }
    });
  };

  const openHistory = (key: string) => {
    setHistoryKey(key);
    startTransition(async () => {
      try {
        const items = await getControlCenterPlatformSettingHistoryAction(key);
        setHistoryItems(items);
      } catch (historyError) {
        toast.error(historyError instanceof Error ? historyError.message : "Unable to load history");
        setHistoryKey(null);
      }
    });
  };

  const handleExport = () => {
    startTransition(async () => {
      try {
        const json = await exportControlCenterPlatformSettingsAction();
        const blob = new Blob([json], { type: "application/json;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `busal-platform-settings-${new Date().toISOString().slice(0, 10)}.json`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success("Configuration exported");
      } catch (exportError) {
        toast.error(exportError instanceof Error ? exportError.message : "Export failed");
      }
    });
  };

  const handleImport = () => {
    startTransition(async () => {
      try {
        const parsed = JSON.parse(importText) as {
          settings?: Array<{ key: string; value: unknown }>;
        };
        const settings = parsed.settings ?? [];
        const result = await importControlCenterPlatformSettingsAction({
          settings,
          changeReason: "Imported from Control Center",
        });
        toast.success(`${result.imported} settings imported`);
        setImportOpen(false);
        setImportText("");
        refresh();
      } catch (importError) {
        toast.error(importError instanceof Error ? importError.message : "Import failed");
      }
    });
  };

  const renderInput = (field: ControlCenterPlatformSettingField) => {
    const value = drafts[field.key] ?? serializeFieldValue(field);

    if (field.valueType === "BOOLEAN") {
      return (
        <select
          value={value}
          disabled={!permissions.canEdit || isPending}
          onChange={(event) =>
            setDrafts((current) => ({ ...current, [field.key]: event.target.value }))
          }
          className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
        >
          <option value="true">Enabled</option>
          <option value="false">Disabled</option>
        </select>
      );
    }

    if (field.allowedValues && field.allowedValues.length > 0) {
      return (
        <select
          value={value}
          disabled={!permissions.canEdit || isPending}
          onChange={(event) =>
            setDrafts((current) => ({ ...current, [field.key]: event.target.value }))
          }
          className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
        >
          {field.allowedValues.map((option) => (
            <option key={String(option)} value={String(option)}>
              {String(option)}
            </option>
          ))}
        </select>
      );
    }

    if (field.valueType === "JSON") {
      return (
        <textarea
          value={value}
          disabled={!permissions.canEdit || isPending}
          onChange={(event) =>
            setDrafts((current) => ({ ...current, [field.key]: event.target.value }))
          }
          className="border-input bg-background min-h-28 w-full rounded-md border p-3 font-mono text-sm"
        />
      );
    }

    return (
      <Input
        value={value}
        type={field.valueType === "NUMBER" ? "number" : "text"}
        disabled={!permissions.canEdit || isPending}
        onChange={(event) =>
          setDrafts((current) => ({ ...current, [field.key]: event.target.value }))
        }
      />
    );
  };

  if (error) {
    return (
      <ControlCenterErrorState
        title="Unable to load platform settings"
        description={error}
        onRetry={refresh}
      />
    );
  }

  return (
    <PageContainer>
      <SectionHeader
        title="Platform Settings"
        description="Manage platform-wide configuration groups, defaults, validation, and audit history."
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={refresh} disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Refresh
            </Button>
            {permissions.canExport ? (
              <Button variant="outline" size="sm" onClick={handleExport} disabled={isPending}>
                <Download className="h-4 w-4" />
                Export
              </Button>
            ) : null}
            {permissions.canImport ? (
              <Button variant="outline" size="sm" onClick={() => setImportOpen(true)} disabled={isPending}>
                <Upload className="h-4 w-4" />
                Import
              </Button>
            ) : null}
          </div>
        }
      />

      {!permissions.isPlatformOwner ? (
        <Card>
          <CardContent className="py-4 text-sm">
            You have read-only access. Only the Platform Owner can modify platform settings.
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Settings Groups</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {PLATFORM_SETTINGS_GROUPS.map((group) => (
              <button
                key={group.id}
                type="button"
                onClick={() => setActiveGroup(group.id)}
                className={`w-full rounded-md px-3 py-2 text-left text-sm ${
                  activeGroup === group.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                }`}
              >
                {group.title}
              </button>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="relative">
            <Search className="text-muted-foreground absolute top-2.5 left-3 h-4 w-4" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search settings"
              className="pl-9"
            />
          </div>

          {!activeGroupData || activeGroupData.settings.length === 0 ? (
            <ControlCenterEmptyState
              title="No settings found"
              description="Try another group or adjust your search."
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>{activeGroupData.title}</CardTitle>
                <CardDescription>{activeGroupData.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {activeGroupData.settings.map((field) => (
                  <div key={field.key} className="space-y-3 rounded-lg border p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{field.label}</p>
                        <p className="text-muted-foreground text-xs">{field.key}</p>
                        {field.helpText ? (
                          <p className="text-muted-foreground mt-1 text-sm">{field.helpText}</p>
                        ) : null}
                      </div>
                      <div className="text-muted-foreground text-right text-xs">
                        <p>Default: {serializeFieldValue({ ...field, value: field.defaultValue })}</p>
                        <p>Updated: {formatDate(field.updatedAt)}</p>
                      </div>
                    </div>

                    {renderInput(field)}

                    {field.validationError ? (
                      <p className="text-destructive text-sm">{field.validationError}</p>
                    ) : null}

                    <div className="flex flex-wrap gap-2">
                      {permissions.canEdit ? (
                        <Button size="sm" onClick={() => handleSave(field)} disabled={isPending}>
                          <Save className="h-4 w-4" />
                          Save
                        </Button>
                      ) : null}
                      {permissions.canReset ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setResetKey(field.key)}
                          disabled={isPending}
                        >
                          <RotateCcw className="h-4 w-4" />
                          Reset
                        </Button>
                      ) : null}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openHistory(field.key)}
                        disabled={isPending}
                      >
                        <History className="h-4 w-4" />
                        History
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Audit History</CardTitle>
          <CardDescription>Recent platform configuration changes.</CardDescription>
        </CardHeader>
        <CardContent>
          {bundle.audit.length === 0 ? (
            <p className="text-muted-foreground text-sm">No audit entries yet.</p>
          ) : (
            <div className="space-y-3">
              {bundle.audit.slice(0, 20).map((entry) => (
                <div key={entry.id} className="flex flex-wrap justify-between gap-2 border-b pb-2 text-sm">
                  <div>
                    <p className="font-medium">{entry.eventType}</p>
                    <p className="text-muted-foreground text-xs">
                      {entry.definitionKey ?? "platform settings"} · {entry.actorEmail ?? "system"}
                    </p>
                  </div>
                  <p className="text-muted-foreground text-xs">{formatDate(entry.createdAt)}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <TenantConfirmDialog
        open={Boolean(resetKey)}
        title="Reset setting"
        description={`Reset ${resetKey} to its default value?`}
        confirmLabel="Reset"
        destructive
        loading={isPending}
        onConfirm={handleReset}
        onOpenChange={(open) => {
          if (!open) setResetKey(null);
        }}
      />

      <Dialog open={Boolean(historyKey)} onOpenChange={() => setHistoryKey(null)}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Setting history</DialogTitle>
          </DialogHeader>
          {historyItems.length === 0 ? (
            <p className="text-muted-foreground text-sm">No version history recorded.</p>
          ) : (
            <div className="space-y-3">
              {historyItems.map((item) => (
                <div key={item.id} className="rounded-md border p-3 text-sm">
                  <p className="font-medium">Version {item.version}</p>
                  <p className="text-muted-foreground text-xs">
                    {item.changedByEmail ?? "system"} · {formatDate(item.createdAt)}
                  </p>
                  <pre className="bg-muted mt-2 overflow-x-auto rounded p-2 text-xs">
                    {JSON.stringify(item.previousValue, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import configuration</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <textarea
              value={importText}
              onChange={(event) => setImportText(event.target.value)}
              placeholder='{"settings":[{"key":"general.platform_name","value":"Busal"}]}'
              className="border-input bg-background min-h-40 w-full rounded-md border p-3 font-mono text-sm"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                setImportText(await file.text());
              }}
            />
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              Choose JSON file
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleImport} disabled={isPending || !importText.trim()}>
              Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}

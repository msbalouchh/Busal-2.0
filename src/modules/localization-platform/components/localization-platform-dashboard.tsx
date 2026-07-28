import type { LocalizationPlatformDashboardView } from "@/modules/localization-platform/utils/localization-platform-utils";

interface LocalizationPlatformDashboardProps {
  dashboard: LocalizationPlatformDashboardView;
}

export function LocalizationPlatformDashboard({ dashboard }: LocalizationPlatformDashboardProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Languages</p>
        <p className="text-2xl font-semibold">{dashboard.totalLanguages}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Active Languages</p>
        <p className="text-2xl font-semibold">{dashboard.activeLanguages}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Translation Keys</p>
        <p className="text-2xl font-semibold">{dashboard.totalTranslationKeys}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Translations</p>
        <p className="text-2xl font-semibold">{dashboard.totalTranslations}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Versions</p>
        <p className="text-2xl font-semibold">{dashboard.totalVersions}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Registered Keys</p>
        <p className="text-2xl font-semibold">{dashboard.registeredKeys}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Branch Overrides</p>
        <p className="text-2xl font-semibold">{dashboard.branchOverrides}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">User Preferences</p>
        <p className="text-2xl font-semibold">{dashboard.userPreferences}</p>
      </div>
    </div>
  );
}

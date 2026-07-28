interface LocalizationPlatformListsProps {
  languages?: Array<{
    code: string;
    name: string;
    nativeName: string;
    direction: string;
    isActive: boolean;
    isFallback: boolean;
  }>;
  keys?: Array<{
    id: string;
    key: string;
    module: string;
    defaultValue: string;
    currentVersion: number;
    isActive: boolean;
  }>;
  translations?: Array<{
    id: string;
    key: string;
    languageCode: string;
    value: string;
    version: number;
  }>;
  versions?: Array<{
    id: string;
    key: string;
    languageCode: string;
    version: number;
    value: string;
    createdAt: string;
  }>;
  settings?: Array<{
    id: string;
    scopeType: string;
    scopeIdentifier: string;
    languageCode: string;
    fallbackLanguageCode: string;
    timezone: string;
    dateFormat: string;
    timeFormat: string;
    numberFormat: string;
    currencyCode: string;
    countryCode: string;
  }>;
  formatted?: {
    date: string;
    time: string;
    number: string;
    currency: string;
    direction: string;
    isRtl: boolean;
  };
  registrations?: Array<{
    key: string;
    module: string;
    defaultValue: string;
  }>;
  auditLogs?: Array<{
    id: string;
    eventType: string;
    createdAt: string;
  }>;
}

export function LocalizationPlatformLists({
  languages = [],
  keys = [],
  translations = [],
  versions = [],
  settings = [],
  formatted,
  registrations = [],
  auditLogs = [],
}: LocalizationPlatformListsProps) {
  return (
    <div className="space-y-8">
      {languages.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Languages</h2>
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left">Code</th>
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Native</th>
                  <th className="px-4 py-2 text-left">Direction</th>
                  <th className="px-4 py-2 text-left">Fallback</th>
                </tr>
              </thead>
              <tbody>
                {languages.map((language) => (
                  <tr key={language.code} className="border-t">
                    <td className="px-4 py-2">{language.code}</td>
                    <td className="px-4 py-2">{language.name}</td>
                    <td className="px-4 py-2">{language.nativeName}</td>
                    <td className="px-4 py-2">{language.direction}</td>
                    <td className="px-4 py-2">{language.isFallback ? "Yes" : "No"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {keys.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Translation Keys</h2>
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left">Key</th>
                  <th className="px-4 py-2 text-left">Module</th>
                  <th className="px-4 py-2 text-left">Default</th>
                  <th className="px-4 py-2 text-left">Version</th>
                </tr>
              </thead>
              <tbody>
                {keys.map((key) => (
                  <tr key={key.id} className="border-t">
                    <td className="px-4 py-2">{key.key}</td>
                    <td className="px-4 py-2">{key.module}</td>
                    <td className="px-4 py-2">{key.defaultValue}</td>
                    <td className="px-4 py-2">{key.currentVersion}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {translations.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Translations</h2>
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left">Key</th>
                  <th className="px-4 py-2 text-left">Language</th>
                  <th className="px-4 py-2 text-left">Value</th>
                  <th className="px-4 py-2 text-left">Version</th>
                </tr>
              </thead>
              <tbody>
                {translations.map((translation) => (
                  <tr key={translation.id} className="border-t">
                    <td className="px-4 py-2">{translation.key}</td>
                    <td className="px-4 py-2">{translation.languageCode}</td>
                    <td className="px-4 py-2">{translation.value}</td>
                    <td className="px-4 py-2">{translation.version}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {versions.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Translation Versions</h2>
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left">Key</th>
                  <th className="px-4 py-2 text-left">Language</th>
                  <th className="px-4 py-2 text-left">Version</th>
                  <th className="px-4 py-2 text-left">Created</th>
                </tr>
              </thead>
              <tbody>
                {versions.map((version) => (
                  <tr key={version.id} className="border-t">
                    <td className="px-4 py-2">{version.key}</td>
                    <td className="px-4 py-2">{version.languageCode}</td>
                    <td className="px-4 py-2">{version.version}</td>
                    <td className="px-4 py-2">{version.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {settings.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Scope Settings</h2>
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left">Scope</th>
                  <th className="px-4 py-2 text-left">Language</th>
                  <th className="px-4 py-2 text-left">Timezone</th>
                  <th className="px-4 py-2 text-left">Currency</th>
                  <th className="px-4 py-2 text-left">Country</th>
                </tr>
              </thead>
              <tbody>
                {settings.map((setting) => (
                  <tr key={setting.id} className="border-t">
                    <td className="px-4 py-2">{setting.scopeType}</td>
                    <td className="px-4 py-2">{setting.languageCode}</td>
                    <td className="px-4 py-2">{setting.timezone}</td>
                    <td className="px-4 py-2">{setting.currencyCode}</td>
                    <td className="px-4 py-2">{setting.countryCode}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {formatted ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Formatting Preview</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="bg-card rounded-xl border p-4 shadow-sm">
              <p className="text-muted-foreground text-sm">Date</p>
              <p className="text-lg font-medium">{formatted.date}</p>
            </div>
            <div className="bg-card rounded-xl border p-4 shadow-sm">
              <p className="text-muted-foreground text-sm">Time</p>
              <p className="text-lg font-medium">{formatted.time}</p>
            </div>
            <div className="bg-card rounded-xl border p-4 shadow-sm">
              <p className="text-muted-foreground text-sm">Number</p>
              <p className="text-lg font-medium">{formatted.number}</p>
            </div>
            <div className="bg-card rounded-xl border p-4 shadow-sm">
              <p className="text-muted-foreground text-sm">Currency</p>
              <p className="text-lg font-medium">{formatted.currency}</p>
            </div>
            <div className="bg-card rounded-xl border p-4 shadow-sm">
              <p className="text-muted-foreground text-sm">Direction</p>
              <p className="text-lg font-medium">{formatted.direction}</p>
            </div>
            <div className="bg-card rounded-xl border p-4 shadow-sm">
              <p className="text-muted-foreground text-sm">RTL</p>
              <p className="text-lg font-medium">{formatted.isRtl ? "Yes" : "No"}</p>
            </div>
          </div>
        </section>
      ) : null}

      {registrations.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Key Registry</h2>
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left">Key</th>
                  <th className="px-4 py-2 text-left">Module</th>
                  <th className="px-4 py-2 text-left">Default</th>
                </tr>
              </thead>
              <tbody>
                {registrations.map((entry) => (
                  <tr key={entry.key} className="border-t">
                    <td className="px-4 py-2">{entry.key}</td>
                    <td className="px-4 py-2">{entry.module}</td>
                    <td className="px-4 py-2">{entry.defaultValue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {auditLogs.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Audit Logs</h2>
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left">Event</th>
                  <th className="px-4 py-2 text-left">Created</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.id} className="border-t">
                    <td className="px-4 py-2">{log.eventType}</td>
                    <td className="px-4 py-2">{log.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}

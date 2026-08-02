import type {
  MarketplaceHomeWidgets,
  MarketplaceLicenseView,
  MarketplacePlatformPermissions,
} from "@/modules/marketplace-platform/types/marketplace-platform-types";

interface MarketplaceLicensesPanelProps {
  permissions: MarketplacePlatformPermissions;
  licenses: MarketplaceLicenseView[];
  widgets: MarketplaceHomeWidgets;
}

export function MarketplaceLicensesPanel({
  permissions,
  licenses,
  widgets,
}: MarketplaceLicensesPanelProps) {
  if (!permissions.canManageLicenses) {
    return (
      <p className="text-muted-foreground text-sm">
        You do not have permission to view marketplace licenses.
      </p>
    );
  }

  const activeLicenses = licenses.filter(
    (license) => license.status === "ACTIVE" || license.status === "TRIAL",
  );
  const expiringLicenses = licenses.filter((license) => license.isExpiringSoon);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border p-4">
          <p className="text-muted-foreground text-sm">Purchased licenses</p>
          <p className="text-2xl font-semibold">{licenses.length}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-muted-foreground text-sm">Active licenses</p>
          <p className="text-2xl font-semibold">{widgets.activeLicenses}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-muted-foreground text-sm">Expiring soon</p>
          <p className="text-2xl font-semibold">{widgets.expiringLicenses}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-muted-foreground text-sm">Seat usage</p>
          <p className="text-2xl font-semibold">{activeLicenses.length}</p>
        </div>
      </div>

      <div className="rounded-lg border p-4">
        <h2 className="mb-3 font-semibold">License inventory</h2>
        {licenses.length === 0 ? (
          <p className="text-muted-foreground text-sm">No marketplace licenses purchased yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="px-4 py-2 font-medium">Item</th>
                  <th className="px-4 py-2 font-medium">Type</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Expires</th>
                  <th className="px-4 py-2 font-medium">Renewal</th>
                </tr>
              </thead>
              <tbody>
                {licenses.map((license) => (
                  <tr key={license.id} className="border-t">
                    <td className="px-4 py-2">{license.itemName}</td>
                    <td className="px-4 py-2">{license.licenseType}</td>
                    <td className="px-4 py-2">{license.status}</td>
                    <td className="px-4 py-2">
                      {license.expiresAt
                        ? new Date(license.expiresAt).toLocaleDateString()
                        : "No expiry"}
                    </td>
                    <td className="px-4 py-2">
                      {license.isExpiringSoon ? "Renewal recommended" : "Current"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {expiringLicenses.length > 0 ? (
        <div className="rounded-lg border p-4">
          <h2 className="mb-3 font-semibold">Expiring licenses</h2>
          <ul className="space-y-2 text-sm">
            {expiringLicenses.map((license) => (
              <li key={license.id}>
                {license.itemName} · expires{" "}
                {license.expiresAt ? new Date(license.expiresAt).toLocaleDateString() : "soon"}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

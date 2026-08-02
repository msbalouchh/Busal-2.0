import { Bell, Boxes, Building2, Palette, Settings, Shield } from "lucide-react";
import Link from "next/link";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { Button } from "@/components/ui/button";
import { BUSINESS_ROUTES } from "@/modules/business/constants/routes";
import { BUSINESS_MODULE_ROUTES } from "@/modules/business-modules/constants/routes";
import { NOTIFICATIONS_ROUTES } from "@/modules/notifications/constants/routes";
import { RBAC_ROUTES } from "@/modules/rbac/constants/rbac-routes";

export default function ApplicationSettingsPage() {
  return (
    <ApplicationPageTemplate
      title="Settings"
      description="Manage workspace modules, business profile, access control, and notification preferences."
      icon={Settings}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Settings" },
      ]}
    >
      <div className="space-y-4">
        <div className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="flex items-center gap-2 font-semibold">
              <Building2 className="h-4 w-4" aria-hidden="true" />
              Business Profile
            </p>
            <p className="text-muted-foreground text-sm">
              Update legal details, contact information, branches, and operating hours.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href={BUSINESS_ROUTES.profile} aria-label="Open business profile settings">
              Manage profile
            </Link>
          </Button>
        </div>
        <div className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="flex items-center gap-2 font-semibold">
              <Palette className="h-4 w-4" aria-hidden="true" />
              Branding
            </p>
            <p className="text-muted-foreground text-sm">
              Configure logos, colours, and customer-facing brand assets.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href={BUSINESS_ROUTES.branding} aria-label="Open branding settings">
              Manage branding
            </Link>
          </Button>
        </div>
        <div className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="flex items-center gap-2 font-semibold">
              <Boxes className="h-4 w-4" aria-hidden="true" />
              Industry Modules
            </p>
            <p className="text-muted-foreground text-sm">
              View installed modules, enable industry capabilities, and manage module status.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href={BUSINESS_MODULE_ROUTES.dashboard} aria-label="Open modules dashboard">
              Manage modules
            </Link>
          </Button>
        </div>
        <div className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="flex items-center gap-2 font-semibold">
              <Shield className="h-4 w-4" aria-hidden="true" />
              Roles & Permissions
            </p>
            <p className="text-muted-foreground text-sm">
              View system roles, create custom roles, and manage permission assignments.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href={RBAC_ROUTES.roles} aria-label="Open roles and permissions settings">
              Manage roles
            </Link>
          </Button>
        </div>
        <div className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="flex items-center gap-2 font-semibold">
              <Bell className="h-4 w-4" aria-hidden="true" />
              Notification Preferences
            </p>
            <p className="text-muted-foreground text-sm">
              Control delivery channels and categories for workspace notifications.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link
              href={NOTIFICATIONS_ROUTES.preferences}
              aria-label="Open notification preferences"
            >
              Manage notifications
            </Link>
          </Button>
        </div>
      </div>
    </ApplicationPageTemplate>
  );
}

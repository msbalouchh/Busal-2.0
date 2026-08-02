import Image from "next/image";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BUSINESS_PROFILE_NAV_ITEMS,
  BUSINESS_PROFILE_ROUTES,
  INDUSTRY_OPTIONS,
} from "@/modules/business/constants/business-profile";
import { BUSINESS_TYPE_OPTIONS } from "@/modules/onboarding/lib/business-interview-questions";
import { WEEKDAYS } from "@/modules/business/constants/routes";
import type { SerializedBusinessProfile } from "@/modules/business/types/business-profile-types";

interface BusinessOverviewProps {
  profile: SerializedBusinessProfile;
}

function formatBusinessType(value: string | null): string {
  if (!value) return "—";
  return BUSINESS_TYPE_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

function formatIndustry(value: string): string {
  if (!value) return "—";
  return INDUSTRY_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

export function BusinessOverview({ profile }: BusinessOverviewProps) {
  const mainBranch = profile.branches.find((branch) => branch.isMain) ?? profile.branches[0];
  const email = profile.contacts.find((contact) => contact.type === "EMAIL")?.value;
  const phone = profile.contacts.find((contact) => contact.type === "PHONE")?.value;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">{profile.businessName || "Untitled business"}</h2>
          {profile.description ? (
            <p className="text-muted-foreground max-w-2xl text-sm">{profile.description}</p>
          ) : null}
        </div>
        {profile.branding.logoUrl ? (
          <div className="bg-muted relative h-16 w-16 overflow-hidden rounded-lg border">
            <Image
              src={profile.branding.logoUrl}
              alt={`${profile.businessName} logo`}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Legal name:</span> {profile.legalName || "—"}
            </p>
            <p>
              <span className="text-muted-foreground">Business ID:</span> {profile.id}
            </p>
            <p>
              <span className="text-muted-foreground">Type:</span>{" "}
              {formatBusinessType(profile.businessType)}
            </p>
            <p>
              <span className="text-muted-foreground">Industry:</span>{" "}
              {formatIndustry(profile.industry)}
            </p>
            <p>
              <span className="text-muted-foreground">Status:</span>{" "}
              {profile.operational.businessStatus}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Regional</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Timezone:</span> {profile.regional.timezone}
            </p>
            <p>
              <span className="text-muted-foreground">Currency:</span> {profile.regional.currency}
            </p>
            <p>
              <span className="text-muted-foreground">Language:</span> {profile.regional.language}
            </p>
            <p>
              <span className="text-muted-foreground">Date format:</span>{" "}
              {profile.regional.dateFormat}
            </p>
            <p>
              <span className="text-muted-foreground">Time format:</span>{" "}
              {profile.regional.timeFormat}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Email:</span> {email || "—"}
            </p>
            <p>
              <span className="text-muted-foreground">Phone:</span> {phone || "—"}
            </p>
            <p>
              <span className="text-muted-foreground">Support:</span> {profile.supportEmail || "—"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Address</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              {[profile.address.addressLine1, profile.address.addressLine2]
                .filter(Boolean)
                .join(", ") || "—"}
            </p>
            <p>
              {[profile.address.city, profile.address.state, profile.address.postalCode]
                .filter(Boolean)
                .join(", ") || "—"}
            </p>
            <p>{profile.address.country || "—"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Default branch</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Name:</span> {mainBranch?.name ?? "—"}
            </p>
            <p>
              <span className="text-muted-foreground">Active branches:</span>{" "}
              {profile.branches.filter((branch) => branch.isActive !== false).length}
            </p>
            <p>
              <span className="text-muted-foreground">Total branches:</span>{" "}
              {profile.branches.length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Working hours</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {profile.hours.slice(0, 3).map((entry) => {
              const label = WEEKDAYS.find((day) => day.value === entry.dayOfWeek)?.label ?? "Day";

              return (
                <p key={entry.id}>
                  <span className="text-muted-foreground">{label}:</span>{" "}
                  {entry.isClosed
                    ? "Closed"
                    : `${entry.openTime ?? "—"} – ${entry.closeTime ?? "—"}`}
                </p>
              );
            })}
            <Button asChild variant="link" className="h-auto p-0">
              <Link href={BUSINESS_PROFILE_ROUTES.hours}>View all hours</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        {BUSINESS_PROFILE_NAV_ITEMS.filter(
          (item) => item.href !== BUSINESS_PROFILE_ROUTES.overview,
        ).map((item) => (
          <Button key={item.href} asChild variant="outline" size="sm">
            <Link href={item.href}>{item.label}</Link>
          </Button>
        ))}
      </div>
    </div>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BUSINESS_TYPE_OPTIONS } from "@/modules/onboarding/lib/business-interview-questions";
import type {
  BranchData,
  BusinessContactData,
  BusinessHoursData,
} from "@/services/business-management.service";
import { WEEKDAYS } from "@/modules/business/constants/routes";
import type { BusinessProfileData } from "@/types/business-profile";

interface BusinessOverviewProps {
  business: BusinessProfileData;
  branches: BranchData[];
  hours: BusinessHoursData[];
  contacts: BusinessContactData[];
}

function formatBusinessType(value: string | null): string {
  if (!value) return "—";
  return BUSINESS_TYPE_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

export function BusinessOverview({ business, branches, hours, contacts }: BusinessOverviewProps) {
  const mainBranch = branches.find((branch) => branch.isMain) ?? branches[0];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">General</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">Business name:</span>{" "}
            {business.businessName || "—"}
          </p>
          <p>
            <span className="text-muted-foreground">Type:</span>{" "}
            {formatBusinessType(business.businessType)}
          </p>
          <p>
            <span className="text-muted-foreground">Country:</span> {business.country || "—"}
          </p>
          <p>
            <span className="text-muted-foreground">Timezone:</span> {business.timezone || "—"}
          </p>
          <p>
            <span className="text-muted-foreground">Owner:</span> {business.ownerName || "—"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Main Branch</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">Name:</span> {mainBranch?.name ?? "—"}
          </p>
          <p>
            <span className="text-muted-foreground">City:</span> {mainBranch?.city || "—"}
          </p>
          <p>
            <span className="text-muted-foreground">Total branches:</span> {branches.length}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Business Hours</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {hours.map((entry) => {
            const label = WEEKDAYS.find((day) => day.value === entry.dayOfWeek)?.label ?? "Day";

            return (
              <p key={entry.id}>
                <span className="text-muted-foreground">{label}:</span>{" "}
                {entry.isClosed ? "Closed" : `${entry.openTime ?? "—"} – ${entry.closeTime ?? "—"}`}
              </p>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contact</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {contacts.length === 0 ? (
            <p className="text-muted-foreground">No contact details yet.</p>
          ) : (
            contacts.map((contact) => (
              <p key={contact.id}>
                <span className="text-muted-foreground">{contact.label || contact.type}:</span>{" "}
                {contact.value}
                {contact.isPrimary ? " (Primary)" : ""}
              </p>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

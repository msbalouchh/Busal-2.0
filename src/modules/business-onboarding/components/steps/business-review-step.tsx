"use client";

import { Loader2 } from "lucide-react";
import { useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  completeBusinessSetupAction,
  goToBusinessSetupStepAction,
} from "@/modules/business-onboarding/actions/business-setup-actions";
import type { BusinessSetupProfile } from "@/services/business-setup.service";
import { useRouter } from "next/navigation";

interface BusinessReviewStepProps {
  profile: BusinessSetupProfile;
}

export function BusinessReviewStep({ profile }: BusinessReviewStepProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const rows = [
    { label: "Business name", value: profile.businessName },
    { label: "Business type", value: profile.businessType },
    { label: "Industry", value: profile.industry },
    { label: "Country", value: profile.country },
    { label: "Currency", value: profile.currency },
    { label: "Timezone", value: profile.timezone },
    { label: "Phone", value: profile.phone },
    { label: "Business email", value: profile.businessEmail },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-muted/40 rounded-lg border p-4">
        <p className="text-muted-foreground text-sm">
          Your Business ID will be generated on launch
        </p>
        <p className="mt-1 text-lg font-semibold tracking-tight">BUS-XXXXXX</p>
      </div>

      <dl className="space-y-3">
        {rows.map((row) => (
          <div key={row.label} className="flex items-start justify-between gap-4 text-sm">
            <dt className="text-muted-foreground">{row.label}</dt>
            <dd className="text-right font-medium">{row.value ?? "—"}</dd>
          </div>
        ))}
      </dl>

      <Badge variant="secondary">You will be assigned as Owner</Badge>

      <Separator />

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          disabled={isPending}
          onClick={() => {
            startTransition(async () => {
              await goToBusinessSetupStepAction(3);
              router.refresh();
            });
          }}
        >
          Back
        </Button>
        <Button
          type="button"
          className="flex-1"
          disabled={isPending}
          onClick={() => {
            startTransition(async () => {
              await completeBusinessSetupAction();
            });
          }}
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Launch workspace
        </Button>
      </div>
    </div>
  );
}

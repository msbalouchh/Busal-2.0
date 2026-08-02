"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { TEAM_ROLE_OPTIONS } from "@/modules/business-onboarding/constants/onboarding-options";
import {
  OnboardingButton,
  OnboardingField,
} from "@/modules/business-onboarding/components/onboarding-ui";
import type { TeamInvite } from "@/modules/business-onboarding/types/onboarding.types";
import { useWorkspaceWizardStore } from "@/modules/business-onboarding/store/onboarding.store";

interface TeamStepProps {
  onContinue: () => void;
  onSkip: () => void;
}

export function TeamStep({ onContinue, onSkip }: TeamStepProps) {
  const data = useWorkspaceWizardStore();
  const [draft, setDraft] = useState<TeamInvite>({ email: "", role: "staff" });
  const [error, setError] = useState<string | null>(null);

  function addInvite() {
    if (!draft.email.trim()) {
      setError("Enter an email address");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email)) {
      setError("Enter a valid email");
      return;
    }
    data.patch({ teamInvites: [...data.teamInvites, draft] });
    setDraft({ email: "", role: "staff" });
    setError(null);
  }

  return (
    <div className="onboarding__form">
      <p className="text-sm text-white/55">
        Invite team members and assign roles — or skip and invite later.
      </p>
      <div className="onboarding__grid-2">
        <OnboardingField id="inviteEmail" label="Email" error={error ?? undefined}>
          <Input
            id="inviteEmail"
            type="email"
            value={draft.email}
            onChange={(e) => setDraft((p) => ({ ...p, email: e.target.value }))}
          />
        </OnboardingField>
        <OnboardingField id="inviteRole" label="Role">
          <Select
            id="inviteRole"
            value={draft.role}
            onChange={(e) =>
              setDraft((p) => ({ ...p, role: e.target.value as TeamInvite["role"] }))
            }
          >
            {TEAM_ROLE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </OnboardingField>
      </div>
      <OnboardingButton type="button" variant="ghost" onClick={addInvite}>
        <Plus className="mr-2 inline h-4 w-4" aria-hidden="true" />
        Add team member
      </OnboardingButton>
      {data.teamInvites.length > 0 ? (
        <ul className="space-y-2">
          {data.teamInvites.map((invite, i) => (
            <li
              key={`${invite.email}-${i}`}
              className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">{invite.email}</p>
                <p className="text-xs text-white/45 capitalize">{invite.role}</p>
              </div>
              <button
                type="button"
                className="text-white/45 hover:text-white"
                aria-label={`Remove ${invite.email}`}
                onClick={() =>
                  data.patch({ teamInvites: data.teamInvites.filter((_, idx) => idx !== i) })
                }
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="flex flex-wrap gap-3 pt-2">
        <OnboardingButton type="button" variant="ghost" onClick={onSkip}>
          Skip for now
        </OnboardingButton>
        <OnboardingButton type="button" onClick={onContinue}>
          Continue
        </OnboardingButton>
      </div>
    </div>
  );
}

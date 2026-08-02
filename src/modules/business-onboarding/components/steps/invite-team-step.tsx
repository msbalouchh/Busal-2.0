"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  OnboardingButton,
  OnboardingField,
} from "@/modules/business-onboarding/components/onboarding-ui";
import { TEAM_ROLE_OPTIONS } from "@/modules/business-onboarding/constants/onboarding-options";
import type { TeamInvite } from "@/modules/business-onboarding/types/onboarding.types";
import { useOnboardingStore } from "@/modules/business-onboarding/store/onboarding.store";

interface InviteTeamStepProps {
  onContinue: () => void;
  onSkip: () => void;
}

export function InviteTeamStep({ onContinue, onSkip }: InviteTeamStepProps) {
  const data = useOnboardingStore();
  const [draft, setDraft] = useState<TeamInvite>({ email: "", role: "support" });
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
    setDraft({ email: "", role: "support" });
    setError(null);
  }

  function removeInvite(index: number) {
    data.patch({ teamInvites: data.teamInvites.filter((_, i) => i !== index) });
  }

  return (
    <div className="onboarding__form">
      <p className="text-sm text-white/55">
        Optional — invite staff now or add them later from settings.
      </p>

      <div className="onboarding__grid-2">
        <OnboardingField id="inviteEmail" label="Email" error={error ?? undefined}>
          <Input
            id="inviteEmail"
            type="email"
            placeholder="colleague@company.com"
            value={draft.email}
            onChange={(event) => setDraft((prev) => ({ ...prev, email: event.target.value }))}
          />
        </OnboardingField>

        <OnboardingField id="inviteRole" label="Role">
          <Select
            id="inviteRole"
            value={draft.role}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, role: event.target.value as TeamInvite["role"] }))
            }
          >
            {TEAM_ROLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </OnboardingField>
      </div>

      <OnboardingButton
        type="button"
        variant="ghost"
        className="w-full sm:w-auto"
        onClick={addInvite}
      >
        <Plus className="mr-2 inline h-4 w-4" aria-hidden="true" />
        Add invite
      </OnboardingButton>

      {data.teamInvites.length > 0 ? (
        <ul className="space-y-2">
          {data.teamInvites.map((invite, index) => (
            <li
              key={`${invite.email}-${index}`}
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
                onClick={() => removeInvite(index)}
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

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";

import { FormWrapper } from "@/components/common/form-wrapper";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { TEAM_ROLE_OPTIONS } from "@/modules/business-onboarding/constants/onboarding-options";
import {
  OnboardingButton,
  OnboardingField,
} from "@/modules/business-onboarding/components/onboarding-ui";
import {
  teamInviteSchema,
  type TeamInviteValues,
} from "@/modules/business-onboarding/schemas/onboarding.schema";
import { useWorkspaceWizardStore } from "@/modules/business-onboarding/store/onboarding.store";

interface TeamStepProps {
  onContinue: () => void;
  onSkip: () => void;
}

const TEAM_INVITE_FORM_ID = "workspace-form-team-invite";

export function TeamStep({ onContinue, onSkip }: TeamStepProps) {
  const data = useWorkspaceWizardStore();

  const form = useForm<TeamInviteValues>({
    resolver: zodResolver(teamInviteSchema),
    defaultValues: { email: "", role: "support" },
  });

  function addInvite(values: TeamInviteValues) {
    data.patch({ teamInvites: [...data.teamInvites, values] });
    form.reset({ email: "", role: "support" });
  }

  return (
    <div className="onboarding__form">
      <p className="text-sm text-white/55">
        Invite team members and assign roles — or skip and invite later.
      </p>

      <FormWrapper
        id={TEAM_INVITE_FORM_ID}
        form={form}
        className="onboarding__form"
        onSubmit={addInvite}
      >
        <div className="onboarding__grid-2">
          <OnboardingField
            id="inviteEmail"
            label="Email"
            error={form.formState.errors.email?.message}
          >
            <Input id="inviteEmail" type="email" {...form.register("email")} />
          </OnboardingField>
          <OnboardingField id="inviteRole" label="Role">
            <Select id="inviteRole" {...form.register("role")}>
              {TEAM_ROLE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </OnboardingField>
        </div>
        <OnboardingButton type="submit" variant="ghost">
          <Plus className="mr-2 inline h-4 w-4" aria-hidden="true" />
          Add team member
        </OnboardingButton>
      </FormWrapper>

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

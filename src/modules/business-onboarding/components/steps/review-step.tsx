"use client";

import {
  AI_AGENT_OPTIONS,
  BUSINESS_TYPE_OPTIONS,
  COUNTRY_OPTIONS,
  INDUSTRY_OPTIONS,
  MODULE_OPTIONS,
} from "@/modules/business-onboarding/constants/onboarding-options";
import { useOnboardingStore } from "@/modules/business-onboarding/store/onboarding.store";

function labelFor<T extends { value: string; label: string }>(
  options: readonly T[],
  value: string,
) {
  return options.find((option) => option.value === value)?.label ?? value;
}

export function ReviewStep() {
  const data = useOnboardingStore();

  const moduleLabels = data.modules
    .map((id) => MODULE_OPTIONS.find((option) => option.id === id)?.label ?? id)
    .join(", ");

  const aiLabels = data.aiAgents
    .map((id: string) => AI_AGENT_OPTIONS.find((option) => option.id === id)?.label ?? id)
    .join(", ");

  return (
    <div className="onboarding__summary">
      <section className="onboarding__summary-section">
        <h3>Business</h3>
        <dl>
          <div>
            <dt>Name</dt>
            <dd>{data.businessName}</dd>
          </div>
          <div>
            <dt>Industry</dt>
            <dd>{labelFor(INDUSTRY_OPTIONS, data.industry)}</dd>
          </div>
          <div>
            <dt>Type</dt>
            <dd>{labelFor(BUSINESS_TYPE_OPTIONS, data.businessType)}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>{data.businessEmail}</dd>
          </div>
        </dl>
      </section>

      <section className="onboarding__summary-section">
        <h3>Locations</h3>
        <dl>
          <div>
            <dt>Country</dt>
            <dd>{labelFor(COUNTRY_OPTIONS, data.country)}</dd>
          </div>
          <div>
            <dt>City</dt>
            <dd>{data.city}</dd>
          </div>
          <div>
            <dt>Structure</dt>
            <dd>
              {data.structure === "single" ? "Single location" : `${data.branchCount} branches`}
            </dd>
          </div>
        </dl>
      </section>

      <section className="onboarding__summary-section">
        <h3>Modules</h3>
        <p className="text-sm font-semibold text-white/90">{moduleLabels || "—"}</p>
      </section>

      <section className="onboarding__summary-section">
        <h3>AI</h3>
        <p className="text-sm font-semibold text-white/90">{aiLabels || "—"}</p>
      </section>

      <section className="onboarding__summary-section">
        <h3>Branding</h3>
        <dl>
          <div>
            <dt>Primary</dt>
            <dd>{data.primaryColor}</dd>
          </div>
          <div>
            <dt>Secondary</dt>
            <dd>{data.secondaryColor}</dd>
          </div>
          <div>
            <dt>Logo</dt>
            <dd>{data.logoDataUrl ? "Uploaded" : "Not uploaded"}</dd>
          </div>
        </dl>
      </section>

      <section className="onboarding__summary-section">
        <h3>Team</h3>
        <dd>
          {data.teamInvites.length > 0
            ? `${data.teamInvites.length} invite${data.teamInvites.length === 1 ? "" : "s"}`
            : "No invites yet"}
        </dd>
      </section>
    </div>
  );
}

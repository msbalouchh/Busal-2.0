import type { Metadata } from "next";

import { AiSettingsPanel } from "@/modules/ai-platform/components/ai-settings-panel";
import { getAiPlatformSettingsContext } from "@/modules/ai-platform/lib/get-ai-platform-context";

export const metadata: Metadata = {
  title: "AI Settings",
};

export default async function AiPlatformSettingsPage() {
  const { permissions, settings } = await getAiPlatformSettingsContext();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">AI Settings</h1>
        <p className="text-muted-foreground text-sm">
          Default model, temperature, token limits, usage limits, privacy, and knowledge settings.
        </p>
      </div>
      <AiSettingsPanel permissions={permissions} settings={settings} />
    </div>
  );
}

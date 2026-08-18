import { PageContainer } from "@/components/common/page-container";
import { WhiteLabelSettingsForm } from "@/modules/platform/components/white-label-settings-form";
import { getWhiteLabelSettingsContext } from "@/modules/platform/lib/get-white-label-settings-context";

export default async function TenantPlatformWhiteLabelPage() {
  const { config, entitlements } = await getWhiteLabelSettingsContext();

  return (
    <PageContainer
      title="White Label & Platform"
      description="Configure branding, domains, and API consumption for your business platform."
    >
      <WhiteLabelSettingsForm config={config} entitlements={entitlements} />
    </PageContainer>
  );
}

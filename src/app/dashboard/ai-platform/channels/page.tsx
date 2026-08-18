import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { ChannelsPanel } from "@/modules/customer-ai/omnichannel/components/channels-panel";
import { getChannelsDashboardAction } from "@/modules/customer-ai/omnichannel/actions/channel-actions";
import { protectedPage } from "@/modules/platform-guards/guards/page.guards";

export default async function AiChannelsPage() {
  const platform = await protectedPage({ permission: PERMISSION_CODES.AI_VIEW });
  const data = await getChannelsDashboardAction();
  const canManage =
    platform.isOwner || platform.permissions.includes(PERMISSION_CODES.AI_AGENT_EDIT);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">AI Channels</h1>
        <p className="text-muted-foreground text-sm">
          Connect WhatsApp, Instagram, Facebook Messenger, and TikTok to your Busal Customer AI.
          All channels share one AI brain — identity, memory, knowledge, and tools.
        </p>
      </div>
      <ChannelsPanel
        channels={data.channels}
        channelSettings={data.channelSettings}
        canManage={canManage}
      />
    </div>
  );
}

import { PlatformCeoHub } from "@/modules/control-center/platform-ceo/components/platform-ceo-hub";
import { getPlatformCeoContext } from "@/modules/control-center/platform-ceo/lib/get-platform-ceo-context";

export const dynamic = "force-dynamic";

interface ControlCenterCeoPageProps {
  searchParams?: Promise<{
    conversationId?: string;
    search?: string;
  }>;
}

export default async function ControlCenterCeoPage({ searchParams }: ControlCenterCeoPageProps) {
  const params = (await searchParams) ?? {};

  const bundle = await getPlatformCeoContext({
    conversationId: params.conversationId,
    search: params.search,
  });

  return <PlatformCeoHub initialBundle={bundle} />;
}

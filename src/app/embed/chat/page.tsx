import { EmbedChatWidget } from "@/modules/customer-ai/components/embed-chat-widget";

interface EmbedChatPageProps {
  searchParams: Promise<{ businessId?: string; token?: string }>;
}

export default async function EmbedChatPage({ searchParams }: EmbedChatPageProps) {
  const params = await searchParams;
  const businessId = params.businessId ?? "";
  const token = params.token ?? "";

  if (!businessId || !token) {
    return (
      <main className="mx-auto max-w-lg p-4">
        <p className="text-destructive text-sm">Missing embed parameters.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-lg p-4">
      <EmbedChatWidget businessId={businessId} token={token} />
    </main>
  );
}

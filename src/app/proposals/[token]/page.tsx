import { PublicProposalView } from "@/modules/quotes/components/quotes-lists";
import { getProposalByToken, recordProposalView } from "@/services/quotes-proposals.service";

interface PublicProposalPageProps {
  params: Promise<{ token: string }>;
}

export default async function PublicProposalPage({ params }: PublicProposalPageProps) {
  const { token } = await params;

  try {
    await recordProposalView(token);
    const { proposal, quote } = await getProposalByToken(token);

    return <PublicProposalView proposal={proposal} quote={quote} />;
  } catch {
    return (
      <div className="mx-auto max-w-xl p-6 text-center">
        <h1 className="text-xl font-semibold">Proposal unavailable</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          This proposal link is invalid or has expired.
        </p>
      </div>
    );
  }
}

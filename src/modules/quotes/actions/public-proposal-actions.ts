"use server";

import { revalidatePath } from "next/cache";

import { PROPOSAL_PUBLIC_ROUTES } from "@/modules/quotes/constants/routes";
import {
  acceptProposal,
  recordProposalView,
  rejectProposal,
} from "@/services/quotes-proposals.service";

export async function recordProposalViewAction(
  deliveryToken: string,
  input?: { viewerEmail?: string | null },
) {
  await recordProposalView(deliveryToken, input);
  revalidatePath(PROPOSAL_PUBLIC_ROUTES.view(deliveryToken));
}

export async function acceptPublicProposalAction(
  deliveryToken: string,
  input: { acceptedByName: string; acceptedByEmail: string; signatureNotes?: string | null },
) {
  await acceptProposal(deliveryToken, input);
  revalidatePath(PROPOSAL_PUBLIC_ROUTES.view(deliveryToken));
}

export async function rejectPublicProposalAction(
  deliveryToken: string,
  input: { acceptedByName: string; acceptedByEmail: string; signatureNotes?: string | null },
) {
  await rejectProposal(deliveryToken, input);
  revalidatePath(PROPOSAL_PUBLIC_ROUTES.view(deliveryToken));
}

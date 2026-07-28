"use server";

import { revalidatePath } from "next/cache";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedAction } from "@/modules/platform-guards/guards/action.guards";
import { CONTRACTS_ROUTES } from "@/modules/contracts/constants/routes";
import type { ContractSignatureParty, ContractSignatureProvider } from "@prisma/client";
import {
  activateContract,
  addContractDocument,
  archiveContract,
  createContractRevision,
  createLegalClause,
  generateContractFromProposal,
  recordContractSignature,
  requestContractApproval,
  reviewContractApproval,
  scheduleContractRenewal,
} from "@/services/contracts.service";

function revalidateContractsPaths() {
  Object.values(CONTRACTS_ROUTES).forEach((path) => {
    revalidatePath(path);
  });
}

export async function generateContractAction(input: {
  proposalId: string;
  contractTypeId?: string;
  title?: string;
  legalClauseIds?: string[];
  startDate?: string | null;
  endDate?: string | null;
}) {
  return protectedAction(PERMISSION_CODES.CONTRACTS_CREATE, async ({ business, platform }) => {
    const contract = await generateContractFromProposal(
      business.id,
      platform.staffSession?.staffId ?? null,
      {
        ...input,
        startDate: input.startDate ? new Date(input.startDate) : null,
        endDate: input.endDate ? new Date(input.endDate) : null,
      },
    );
    revalidateContractsPaths();
    return { success: true as const, contractId: contract.id };
  });
}

export async function createContractRevisionAction(
  contractId: string,
  input?: { title?: string; summary?: string | null },
) {
  return protectedAction(PERMISSION_CODES.CONTRACTS_EDIT, async ({ business, platform }) => {
    await createContractRevision(
      contractId,
      business.id,
      platform.staffSession?.staffId ?? null,
      input,
    );
    revalidateContractsPaths();
    return { success: true as const };
  });
}

export async function requestContractApprovalAction(
  contractId: string,
  requestNotes?: string | null,
) {
  return protectedAction(PERMISSION_CODES.CONTRACTS_EDIT, async ({ business, platform }) => {
    await requestContractApproval(
      contractId,
      business.id,
      platform.staffSession?.staffId ?? null,
      requestNotes,
    );
    revalidateContractsPaths();
    return { success: true as const };
  });
}

export async function reviewContractApprovalAction(
  contractId: string,
  input: { approved: boolean; reviewNotes?: string | null },
) {
  return protectedAction(PERMISSION_CODES.CONTRACTS_APPROVE, async ({ business, platform }) => {
    await reviewContractApproval(
      contractId,
      business.id,
      platform.staffSession?.staffId ?? null,
      input,
    );
    revalidateContractsPaths();
    return { success: true as const };
  });
}

export async function recordContractSignatureAction(
  contractId: string,
  input: {
    party: ContractSignatureParty;
    signedByName: string;
    signedByEmail: string;
    provider?: ContractSignatureProvider;
    externalReference?: string | null;
  },
) {
  return protectedAction(PERMISSION_CODES.CONTRACTS_EDIT, async ({ business, platform }) => {
    await recordContractSignature(
      contractId,
      business.id,
      platform.staffSession?.staffId ?? null,
      input,
    );
    revalidateContractsPaths();
    return { success: true as const };
  });
}

export async function activateContractAction(
  contractId: string,
  input?: {
    customerSuccessManagerId?: string | null;
    customerName?: string;
    customerEmail?: string | null;
    customerPhone?: string | null;
  },
) {
  return protectedAction(PERMISSION_CODES.CONTRACTS_ACTIVATE, async ({ business, platform }) => {
    await activateContract(
      contractId,
      business.id,
      platform.staffSession?.staffId ?? null,
      input ?? {},
    );
    revalidateContractsPaths();
    return { success: true as const };
  });
}

export async function archiveContractAction(contractId: string) {
  return protectedAction(PERMISSION_CODES.CONTRACTS_ARCHIVE, async ({ business, platform }) => {
    await archiveContract(contractId, business.id, platform.staffSession?.staffId ?? null);
    revalidateContractsPaths();
    return { success: true as const };
  });
}

export async function createLegalClauseAction(input: {
  category: string;
  title: string;
  content: string;
  sortOrder?: number;
}) {
  return protectedAction(PERMISSION_CODES.CLAUSES_MANAGE, async ({ business, platform }) => {
    const clause = await createLegalClause(
      business.id,
      platform.staffSession?.staffId ?? null,
      input,
    );
    revalidateContractsPaths();
    return { success: true as const, clauseId: clause.id };
  });
}

export async function addContractDocumentAction(
  contractId: string,
  input: {
    name: string;
    fileName: string;
    mimeType: string;
    storageKey: string;
    versionNumber?: number;
  },
) {
  return protectedAction(PERMISSION_CODES.CONTRACTS_EDIT, async ({ business, platform }) => {
    await addContractDocument(
      contractId,
      business.id,
      platform.staffSession?.staffId ?? null,
      input,
    );
    revalidateContractsPaths();
    return { success: true as const };
  });
}

export async function scheduleContractRenewalAction(
  contractId: string,
  input: { renewalDate: string; newEndDate?: string | null; notes?: string | null },
) {
  return protectedAction(PERMISSION_CODES.CONTRACTS_EDIT, async ({ business, platform }) => {
    await scheduleContractRenewal(contractId, business.id, platform.staffSession?.staffId ?? null, {
      renewalDate: new Date(input.renewalDate),
      newEndDate: input.newEndDate ? new Date(input.newEndDate) : null,
      notes: input.notes,
    });
    revalidateContractsPaths();
    return { success: true as const };
  });
}

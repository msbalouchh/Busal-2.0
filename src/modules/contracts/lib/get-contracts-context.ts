import { cache } from "react";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedPage } from "@/modules/platform-guards/guards/page.guards";
import {
  serializeContract,
  serializeContractsDashboard,
} from "@/modules/contracts/utils/contract-utils";
import {
  getContractsDashboard,
  listContractTypes,
  listContracts,
  listLegalClauses,
} from "@/services/contracts.service";

export const getContractsOverviewContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.CONTRACTS_VIEW });
  const dashboard = await getContractsDashboard(context.business.id);

  return {
    context,
    dashboard: serializeContractsDashboard(dashboard),
  };
});

export const getContractsListContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.CONTRACTS_VIEW });
  const contracts = await listContracts(context.business.id);

  return {
    context,
    contracts: contracts.map(serializeContract),
  };
});

export const getContractTypesContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.CONTRACTS_VIEW });
  const types = await listContractTypes(context.business.id);

  return { context, types };
});

export const getLegalClausesContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.CLAUSES_MANAGE });
  const clauses = await listLegalClauses(context.business.id);

  return { context, clauses };
});

export const getContractDocumentsContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.CONTRACTS_VIEW });
  const contracts = await listContracts(context.business.id);
  const documents = contracts.flatMap((contract) =>
    contract.documents.map((document) => ({
      ...document,
      contractNumber: contract.contractNumber,
    })),
  );

  return { context, documents };
});

export const getContractRenewalsContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.CONTRACTS_VIEW });
  const contracts = await listContracts(context.business.id);
  const renewals = contracts.flatMap((contract) =>
    contract.renewals.map((renewal) => ({
      ...renewal,
      contractNumber: contract.contractNumber,
    })),
  );

  return { context, renewals };
});

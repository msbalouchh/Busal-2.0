import { formatMoneyPence } from "@/modules/payments/utils/currency";
import type {
  ContractData,
  ContractsDashboardData,
  ContractTypeData,
  LegalClauseData,
} from "@/services/contracts.service";

export function formatContractMoney(pence: number): string {
  return formatMoneyPence(pence);
}

export type ContractsDashboardView = ContractsDashboardData;
export type ContractView = ContractData;
export type ContractTypeView = ContractTypeData;
export type LegalClauseView = LegalClauseData;

export function serializeContractsDashboard(
  dashboard: ContractsDashboardData,
): ContractsDashboardView {
  return dashboard;
}

export function serializeContract(contract: ContractData): ContractView {
  return contract;
}

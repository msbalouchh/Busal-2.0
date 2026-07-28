import {
  CONTRACT_STATUS_LABELS,
  SIGNATURE_PROVIDER_LABELS,
} from "@/modules/contracts/constants/routes";
import type {
  ContractTypeView,
  ContractView,
  LegalClauseView,
} from "@/modules/contracts/utils/contract-utils";
import { formatContractMoney } from "@/modules/contracts/utils/contract-utils";

export function ContractsList({ contracts }: { contracts: ContractView[] }) {
  if (contracts.length === 0) {
    return <p className="text-muted-foreground text-sm">No contracts yet.</p>;
  }

  return (
    <ul className="space-y-2 text-sm">
      {contracts.map((contract) => (
        <li key={contract.id} className="rounded-md border p-3">
          <div className="flex justify-between gap-3">
            <span className="font-medium">{contract.contractNumber}</span>
            <span className="text-muted-foreground">{CONTRACT_STATUS_LABELS[contract.status]}</span>
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            {contract.contractTypeName} · {contract.opportunityName} · v{contract.versionCount}
          </p>
          {contract.currentVersion ? (
            <p className="text-muted-foreground mt-1 text-xs">
              {formatContractMoney(contract.currentVersion.totalPence)} ·{" "}
              {contract.currentVersion.lineItems.length} line items ·{" "}
              {contract.signatures.filter((signature) => signature.status === "SIGNED").length}/
              {contract.signatures.length} signed
            </p>
          ) : null}
          {contract.activation ? (
            <p className="mt-1 text-xs text-green-700">
              Activated — {contract.activation.customerName} ·{" "}
              {contract.activation.activatedProducts.length} products
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export function ContractBuilderSummary({ contract }: { contract: ContractView }) {
  if (!contract.currentVersion) {
    return null;
  }

  const version = contract.currentVersion;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <p className="text-muted-foreground text-sm">Subtotal</p>
          <p className="text-xl font-semibold">{formatContractMoney(version.subtotalPence)}</p>
        </div>
        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <p className="text-muted-foreground text-sm">Tax</p>
          <p className="text-xl font-semibold">{formatContractMoney(version.taxPence)}</p>
        </div>
        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <p className="text-muted-foreground text-sm">Total</p>
          <p className="text-xl font-semibold">{formatContractMoney(version.totalPence)}</p>
        </div>
      </div>
      <ul className="space-y-2 text-sm">
        {version.lineItems.map((line) => (
          <li key={line.id} className="rounded-md border p-3">
            <div className="flex justify-between gap-3">
              <span className="font-medium">
                {line.customName ?? line.productName ?? line.bundleName ?? "Line item"}
              </span>
              <span>{formatContractMoney(line.unitPricePence * line.quantity)}</span>
            </div>
          </li>
        ))}
      </ul>
      {version.clauses.length > 0 ? (
        <div className="rounded-md border p-3 text-sm">
          <h3 className="mb-2 font-medium">Legal Clauses</h3>
          <ul className="space-y-2">
            {version.clauses.map((clause) => (
              <li key={clause.id}>
                <p className="font-medium">{clause.title}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {contract.signatures.length > 0 ? (
        <ul className="space-y-2 text-sm">
          {contract.signatures.map((signature) => (
            <li key={signature.id} className="rounded-md border p-3">
              {signature.party} — {signature.status} ·{" "}
              {SIGNATURE_PROVIDER_LABELS[signature.provider]}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function ContractTypesList({ types }: { types: ContractTypeView[] }) {
  if (types.length === 0) {
    return <p className="text-muted-foreground text-sm">No contract types configured.</p>;
  }

  return (
    <ul className="space-y-2 text-sm">
      {types.map((type) => (
        <li key={type.id} className="rounded-md border p-3">
          <div className="flex justify-between gap-3">
            <span className="font-medium">{type.name}</span>
            <span className="text-muted-foreground">{type.slug}</span>
          </div>
          {type.description ? (
            <p className="text-muted-foreground mt-1 text-xs">{type.description}</p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export function LegalClausesList({ clauses }: { clauses: LegalClauseView[] }) {
  if (clauses.length === 0) {
    return <p className="text-muted-foreground text-sm">No legal clauses yet.</p>;
  }

  return (
    <ul className="space-y-2 text-sm">
      {clauses.map((clause) => (
        <li key={clause.id} className="rounded-md border p-3">
          <div className="flex justify-between gap-3">
            <span className="font-medium">{clause.title}</span>
            <span className="text-muted-foreground">{clause.category}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function ContractDocumentsList({
  documents,
}: {
  documents: Array<{
    id: string;
    name: string;
    fileName: string;
    mimeType: string;
    contractNumber: string;
    versionNumber: number;
    createdAt: Date;
  }>;
}) {
  if (documents.length === 0) {
    return <p className="text-muted-foreground text-sm">No documents uploaded yet.</p>;
  }

  return (
    <ul className="space-y-2 text-sm">
      {documents.map((document) => (
        <li key={document.id} className="rounded-md border p-3">
          <div className="flex justify-between gap-3">
            <span className="font-medium">{document.name}</span>
            <span className="text-muted-foreground">{document.contractNumber}</span>
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            {document.fileName} · v{document.versionNumber}
          </p>
        </li>
      ))}
    </ul>
  );
}

export function ContractRenewalsList({
  renewals,
}: {
  renewals: Array<{
    id: string;
    status: string;
    renewalDate: Date;
    contractNumber: string;
    notes: string | null;
  }>;
}) {
  if (renewals.length === 0) {
    return <p className="text-muted-foreground text-sm">No renewals scheduled.</p>;
  }

  return (
    <ul className="space-y-2 text-sm">
      {renewals.map((renewal) => (
        <li key={renewal.id} className="rounded-md border p-3">
          <div className="flex justify-between gap-3">
            <span className="font-medium">{renewal.contractNumber}</span>
            <span className="text-muted-foreground">{renewal.status}</span>
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            Renewal {renewal.renewalDate.toLocaleDateString()}
          </p>
        </li>
      ))}
    </ul>
  );
}

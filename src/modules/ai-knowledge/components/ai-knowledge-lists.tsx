import { KNOWLEDGE_SOURCE_TYPE_LABELS } from "@/modules/ai-knowledge/constants/routes";
import { PLANNED_KNOWLEDGE_CONNECTORS } from "@/modules/ai-knowledge/constants/connectors";
import type {
  KnowledgeCollectionView,
  KnowledgeDocumentView,
  KnowledgeSearchAuditView,
} from "@/modules/ai-knowledge/utils/ai-knowledge-utils";

interface AiKnowledgeListsProps {
  collections?: KnowledgeCollectionView[];
  documents?: KnowledgeDocumentView[];
  audits?: KnowledgeSearchAuditView[];
  connectors?: Array<{
    connectorType: string;
    status: string;
    integrationReady: boolean;
  }>;
  variant: "collections" | "documents" | "audit" | "connectors";
}

export function AiKnowledgeLists({
  collections,
  documents,
  audits,
  connectors,
  variant,
}: AiKnowledgeListsProps) {
  if (variant === "collections" && collections) {
    return (
      <div className="overflow-x-auto rounded-xl border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Collection</th>
              <th className="px-4 py-3 font-medium">Module</th>
              <th className="px-4 py-3 font-medium">Language</th>
              <th className="px-4 py-3 font-medium">Sources</th>
              <th className="px-4 py-3 font-medium">Documents</th>
            </tr>
          </thead>
          <tbody>
            {collections.map((collection) => (
              <tr key={collection.id} className="border-t">
                <td className="px-4 py-3">
                  <div className="font-medium">{collection.name}</div>
                  {collection.description ? (
                    <div className="text-muted-foreground text-xs">{collection.description}</div>
                  ) : null}
                </td>
                <td className="px-4 py-3">{collection.module ?? "—"}</td>
                <td className="px-4 py-3">{collection.language}</td>
                <td className="px-4 py-3">{collection.sourceCount}</td>
                <td className="px-4 py-3">{collection.documentCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (variant === "documents" && documents) {
    return (
      <div className="overflow-x-auto rounded-xl border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Document</th>
              <th className="px-4 py-3 font-medium">Collection</th>
              <th className="px-4 py-3 font-medium">Source Type</th>
              <th className="px-4 py-3 font-medium">Version</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((document) => (
              <tr key={document.id} className="border-t">
                <td className="px-4 py-3 font-medium">{document.title}</td>
                <td className="px-4 py-3">{document.collectionName}</td>
                <td className="px-4 py-3">
                  {KNOWLEDGE_SOURCE_TYPE_LABELS[
                    document.sourceType as keyof typeof KNOWLEDGE_SOURCE_TYPE_LABELS
                  ] ?? document.sourceType}
                </td>
                <td className="px-4 py-3">v{document.currentVersionNumber ?? "—"}</td>
                <td className="px-4 py-3">{document.status ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (variant === "audit" && audits) {
    return (
      <div className="overflow-x-auto rounded-xl border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Query</th>
              <th className="px-4 py-3 font-medium">Results</th>
              <th className="px-4 py-3 font-medium">Confidence</th>
              <th className="px-4 py-3 font-medium">Agent</th>
              <th className="px-4 py-3 font-medium">When</th>
            </tr>
          </thead>
          <tbody>
            {audits.map((audit) => (
              <tr key={audit.id} className="border-t">
                <td className="px-4 py-3">{audit.query}</td>
                <td className="px-4 py-3">{audit.resultCount}</td>
                <td className="px-4 py-3">
                  {audit.confidenceScore != null
                    ? `${(audit.confidenceScore * 100).toFixed(0)}%`
                    : "—"}
                </td>
                <td className="px-4 py-3">{audit.agentId ?? "—"}</td>
                <td className="px-4 py-3">{new Date(audit.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (variant === "connectors" && connectors) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground text-sm">
          External connectors are architecture-ready. {PLANNED_KNOWLEDGE_CONNECTORS.length}{" "}
          integrations are planned and not yet enabled.
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          {connectors.map((connector) => (
            <div key={connector.connectorType} className="bg-card rounded-xl border p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-medium">{connector.connectorType.replace(/_/g, " ")}</h3>
                <span className="text-muted-foreground text-xs">{connector.status}</span>
              </div>
              <p className="text-muted-foreground mt-2 text-sm">
                {connector.integrationReady ? "Ready for manual use" : "Planned integration"}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}

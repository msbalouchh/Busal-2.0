import type {
  KnowledgeDashboardView,
  KnowledgeSearchAuditView,
} from "@/modules/ai-knowledge/utils/ai-knowledge-utils";

interface AiKnowledgeDashboardProps {
  dashboard: KnowledgeDashboardView;
  recentSearches: KnowledgeSearchAuditView[];
}

export function AiKnowledgeDashboard({ dashboard, recentSearches }: AiKnowledgeDashboardProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <p className="text-muted-foreground text-sm">Collections</p>
          <p className="text-2xl font-semibold">{dashboard.collectionCount}</p>
        </div>
        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <p className="text-muted-foreground text-sm">Documents</p>
          <p className="text-2xl font-semibold">{dashboard.documentCount}</p>
        </div>
        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <p className="text-muted-foreground text-sm">Published Versions</p>
          <p className="text-2xl font-semibold">{dashboard.publishedVersions}</p>
        </div>
        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <p className="text-muted-foreground text-sm">Knowledge Searches</p>
          <p className="text-2xl font-semibold">{dashboard.searchCount}</p>
        </div>
        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <p className="text-muted-foreground text-sm">Connectors</p>
          <p className="text-2xl font-semibold">{dashboard.connectorCount}</p>
        </div>
      </div>

      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-medium">Recent Knowledge Searches</h2>
        {recentSearches.length === 0 ? (
          <p className="text-muted-foreground text-sm">No knowledge searches yet.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {recentSearches.map((search) => (
              <li key={search.id} className="flex items-center justify-between gap-4">
                <span className="font-medium">{search.query}</span>
                <span className="text-muted-foreground">
                  {search.resultCount} results
                  {search.confidenceScore != null
                    ? ` · ${(search.confidenceScore * 100).toFixed(0)}% confidence`
                    : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

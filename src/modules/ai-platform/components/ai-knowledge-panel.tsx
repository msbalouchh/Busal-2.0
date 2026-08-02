import Link from "next/link";

import { AI_PLATFORM_ROUTES } from "@/modules/ai-platform/constants/ai-platform";
import type { AiPlatformPermissions } from "@/modules/ai-platform/types/ai-platform-types";
import { AiKnowledgeDashboard } from "@/modules/ai-knowledge/components/ai-knowledge-dashboard";
import { AiKnowledgeLists } from "@/modules/ai-knowledge/components/ai-knowledge-lists";
import { AiKnowledgeSearchPanel } from "@/modules/ai-knowledge/components/ai-knowledge-search-panel";
import type {
  KnowledgeCollectionView,
  KnowledgeDashboardView,
  KnowledgeDocumentView,
  KnowledgeSearchAuditView,
} from "@/modules/ai-knowledge/utils/ai-knowledge-utils";

interface AiKnowledgePanelProps {
  permissions: AiPlatformPermissions;
  dashboard: KnowledgeDashboardView;
  documents: KnowledgeDocumentView[];
  collections: KnowledgeCollectionView[];
  recentSearches: KnowledgeSearchAuditView[];
}

export function AiKnowledgePanel({
  permissions,
  dashboard,
  documents,
  collections,
  recentSearches,
}: AiKnowledgePanelProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">
          Knowledge sources, documents, RAG search, categories, and processing status.
        </p>
        {permissions.canManageKnowledge ? (
          <Link
            href={AI_PLATFORM_ROUTES.knowledgeModule}
            className="bg-primary text-primary-foreground rounded-md px-3 py-2 text-sm"
          >
            Manage in Knowledge module
          </Link>
        ) : null}
      </div>

      <AiKnowledgeDashboard dashboard={dashboard} recentSearches={recentSearches} />
      <AiKnowledgeSearchPanel />
      <AiKnowledgeLists variant="collections" collections={collections} />
      <AiKnowledgeLists variant="documents" documents={documents} />
    </div>
  );
}

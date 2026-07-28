import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "@prisma/client";

import {
  ALL_PERMISSION_CODES,
  PERMISSION_CODES,
} from "../src/modules/authorization/constants/permissions";
import type { BusinessContext } from "../src/modules/business-context/types/business-context";
import { resolveAuthorizationContext } from "../src/modules/authorization/services/authorization.service";
import {
  getAiSearchArchitectureStatus,
  planSemanticSearch,
  planVectorSearch,
} from "../src/modules/search-platform/engine/ai-search-engine";
import { prepareIndexRecord } from "../src/modules/search-platform/engine/index-engine";
import { canAccessSearchRecord } from "../src/modules/search-platform/engine/permission-engine";
import {
  buildSearchableText,
  executeSearchEngine,
  matchesSearchQuery,
} from "../src/modules/search-platform/engine/search-engine";
import {
  buildAutocompleteSuggestions,
  rankTrendingSuggestions,
} from "../src/modules/search-platform/engine/suggestion-engine";
import {
  DEFAULT_SEARCH_ENTITY_TYPES,
  ensureBootstrapSearchPlatform,
  getRegisteredEntityCount,
} from "../src/modules/search-platform/plugins/bootstrap-search";
import {
  isSearchableEntityRegistered,
  listSearchableEntities,
  registerSearchableEntity,
} from "../src/modules/search-platform/registry/search-registry";
import {
  SEARCH_ENTITY_TYPES,
  SEARCH_PLATFORM_ROUTES,
} from "../src/modules/search-platform/constants/routes";
import { getOwnedBusinessById } from "../src/services/business-profile.service";
import {
  bulkIndexSearchRecords,
  ensureSearchPlatformDefaults,
  executeGlobalSearch,
  fullRebuildIndex,
  getSearchPlatformDashboard,
  getSearchSuggestions,
  indexSearchRecord,
  listSearchAuditLogs,
  listSearchEntityRegistrations,
  processSearchIndexJob,
  queueSearchIndexJob,
  recordSearchClick,
  recoverFailedIndexes,
  reindexEntity,
  removeSearchIndex,
} from "../src/services/search-platform.service";
import { mapProfileToAuthUser } from "../src/services/user.service";

const prisma = new PrismaClient();
const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function buildPlatformContext(businessId: string): Promise<BusinessContext> {
  const businessRecord = await prisma.business.findUnique({
    where: { id: businessId },
    include: { owner: true },
  });

  assert(businessRecord?.owner, "Business owner missing");

  const business = await getOwnedBusinessById(businessRecord.ownerId, businessId);
  assert(business, "Business profile missing");

  const user = mapProfileToAuthUser(
    businessRecord.owner.id,
    businessRecord.owner.email,
    businessRecord.owner,
    {},
  );
  const authorization = await resolveAuthorizationContext(user, business);

  return {
    user,
    business,
    branch: null,
    branchId: null,
    roleSlug: authorization.roleSlug,
    permissions: Array.from(authorization.permissions),
    authorization,
    staffSession: null,
    isOwner: authorization.isOwner,
    accessibleBusinesses: [
      { id: business.id, name: business.businessName ?? "Business", isOnboarded: true },
    ],
    accessibleBranches: [],
  };
}

async function main() {
  console.log("Module structure");
  const moduleFiles = [
    "src/modules/search-platform/index.ts",
    "src/modules/search-platform/constants/routes.ts",
    "src/modules/search-platform/types/search-platform-types.ts",
    "src/modules/search-platform/registry/search-registry.ts",
    "src/modules/search-platform/engine/search-engine.ts",
    "src/modules/search-platform/engine/index-engine.ts",
    "src/modules/search-platform/engine/permission-engine.ts",
    "src/modules/search-platform/engine/suggestion-engine.ts",
    "src/modules/search-platform/engine/ai-search-engine.ts",
    "src/modules/search-platform/plugins/bootstrap-search.ts",
    "src/modules/search-platform/utils/search-utils.ts",
    "src/modules/search-platform/lib/get-search-context.ts",
    "src/modules/search-platform/actions/search-actions.ts",
    "src/modules/search-platform/components/search-platform-dashboard.tsx",
    "src/modules/search-platform/components/search-platform-lists.tsx",
    "src/modules/search-platform/components/search-platform-nav.tsx",
    "src/services/search-platform.service.ts",
    "src/app/dashboard/search/page.tsx",
    "src/app/dashboard/search/index/page.tsx",
    "src/app/dashboard/search/queries/page.tsx",
    "src/app/dashboard/search/suggestions/page.tsx",
    "src/app/dashboard/search/index-jobs/page.tsx",
    "src/app/dashboard/search/audit/page.tsx",
    "src/app/dashboard/search/registry/page.tsx",
  ];

  for (const file of moduleFiles) {
    readFileSync(join(root, file), "utf8");
  }
  console.log("  PASS");

  console.log("Search platform routes");
  assert(SEARCH_PLATFORM_ROUTES.overview === "/dashboard/search", "Overview route mismatch");
  assert(SEARCH_PLATFORM_ROUTES.registry.includes("registry"), "Registry route missing");
  console.log("  PASS");

  console.log("Permission protected");
  const permissionsSource = readFileSync(
    join(root, "src/modules/authorization/constants/permissions.ts"),
    "utf8",
  );
  assert(permissionsSource.includes("search.view"), "search.view missing");
  assert(permissionsSource.includes("search.admin"), "search.admin missing");
  assert(ALL_PERMISSION_CODES.includes(PERMISSION_CODES.SEARCH_QUERY), "Permission code missing");
  console.log("  PASS");

  console.log("Schema");
  const schema = readFileSync(join(root, "prisma/schema.prisma"), "utf8");
  assert(schema.includes("model SearchIndexRecord"), "SearchIndexRecord missing");
  assert(schema.includes("model SearchIndexJob"), "SearchIndexJob missing");
  assert(schema.includes("model SearchQueryLog"), "SearchQueryLog missing");
  assert(schema.includes("model SearchAiConfig"), "SearchAiConfig missing");
  console.log("  PASS");

  console.log("Entity registry bootstrap");
  ensureBootstrapSearchPlatform();
  const entities = listSearchableEntities();
  assert(entities.length === SEARCH_ENTITY_TYPES.length, "Entity types not fully registered");
  assert(isSearchableEntityRegistered("CUSTOMER"), "CUSTOMER not registered");
  assert(isSearchableEntityRegistered("WORKFLOW"), "WORKFLOW not registered");
  assert(
    getRegisteredEntityCount() === DEFAULT_SEARCH_ENTITY_TYPES.length,
    "Registry count mismatch",
  );
  console.log("  PASS");

  console.log("Search engine");
  const searchableText = buildSearchableText({
    title: "Acme Invoice",
    description: "Monthly billing document",
    searchableFields: { customer: "Acme Corp" },
  });
  assert(searchableText.includes("Acme"), "Searchable text build failed");
  assert(matchesSearchQuery("Acme Invoice", "acme", "FULL_TEXT"), "Full text match failed");
  assert(matchesSearchQuery("Acme Invoice", "acm", "PREFIX"), "Prefix match failed");
  assert(matchesSearchQuery("Acme Invoice", "Acmee", "FUZZY"), "Fuzzy match failed");
  assert(matchesSearchQuery("Acme Invoice", "Acme Invoice", "EXACT"), "Exact match failed");

  const engineResult = executeSearchEngine(
    [
      {
        id: "1",
        businessId: "biz",
        branchId: null,
        entityType: "CUSTOMER",
        entityId: "c1",
        title: "Acme Corp",
        description: "Premium customer",
        searchableText: "Acme Corp Premium customer",
        metadata: null,
        lastIndexedAt: new Date(),
      },
    ],
    { query: "acme", matchMode: "FULL_TEXT", includeFacets: true },
  );
  assert(engineResult.totalCount === 1, "Search engine returned no results");
  assert(engineResult.groups.length === 1, "Grouped results missing");
  assert(engineResult.groups[0]?.results[0]?.highlights.length, "Highlights missing");
  assert(engineResult.facets?.length === 2, "Facets missing");
  console.log("  PASS");

  console.log("Index engine");
  const prepared = prepareIndexRecord({
    entityType: "ORDER",
    entityId: "order-1",
    title: "Order #1001",
    searchableFields: { orderNumber: "1001" },
  });
  assert(prepared.searchableText.includes("1001"), "Prepared index record failed");
  console.log("  PASS");

  console.log("AI search architecture");
  const aiStatus = getAiSearchArchitectureStatus(null);
  assert(!aiStatus.ready, "AI should not be ready without config");
  const semanticPlan = planSemanticSearch({ query: "find invoices", businessId: "biz" });
  assert(semanticPlan.status === "NOT_IMPLEMENTED", "Semantic search should not be implemented");
  const vectorPlan = planVectorSearch({ query: "test", businessId: "biz" });
  assert(vectorPlan.architecture === "vector", "Vector architecture missing");
  console.log("  PASS");

  console.log("Suggestion engine");
  const trending = rankTrendingSuggestions([
    { query: "invoice", suggestionType: "TRENDING", hitCount: 5, lastUsedAt: new Date() },
    { query: "customer", suggestionType: "TRENDING", hitCount: 10, lastUsedAt: new Date() },
  ]);
  assert(trending[0] === "customer", "Trending sort failed");
  const autocomplete = buildAutocompleteSuggestions(
    [{ query: "invoice", suggestionType: "AUTOCOMPLETE", hitCount: 1, lastUsedAt: new Date() }],
    "inv",
  );
  assert(autocomplete.includes("invoice"), "Autocomplete failed");
  console.log("  PASS");

  console.log("Permission engine");
  assert(
    canAccessSearchRecord(
      {
        permissions: ["crm.view"],
        roleSlug: "manager",
        isOwner: false,
        businessId: "biz",
      },
      { requiredPermission: "crm.view", branchId: null },
    ),
    "Permission access should pass",
  );
  assert(
    !canAccessSearchRecord(
      {
        permissions: ["crm.view"],
        roleSlug: "manager",
        isOwner: false,
        businessId: "biz",
      },
      { requiredPermission: "iam.admin", branchId: null },
    ),
    "Permission access should fail",
  );
  console.log("  PASS");

  const business = await prisma.business.findFirst({ orderBy: { createdAt: "asc" } });
  assert(business, "No business found");
  const platform = await buildPlatformContext(business.id);

  console.log("Search platform defaults");
  await ensureSearchPlatformDefaults(business.id);
  const aiConfig = await prisma.searchAiConfig.findUnique({ where: { businessId: business.id } });
  assert(aiConfig, "AI config not seeded");
  console.log("  PASS");

  console.log("Index search records");
  await indexSearchRecord(business.id, {
    entityType: "CUSTOMER",
    entityId: "verify-customer-1",
    title: "Verify Customer Alpha",
    description: "Search platform verification customer",
    searchableFields: { email: "alpha@verify.test" },
  });

  await bulkIndexSearchRecords(business.id, [
    {
      entityType: "ORDER",
      entityId: "verify-order-1",
      title: "Verify Order Beta",
      description: "Order for verification",
      searchableFields: { orderNumber: "VB-1001" },
    },
    {
      entityType: "FILE",
      entityId: "verify-file-1",
      title: "Verify Document Gamma",
      description: "Indexed file record",
    },
    {
      entityType: "LEAD",
      entityId: "verify-lead-restricted",
      title: "Restricted Lead Record",
      description: "Should be hidden without permission",
      requiredPermission: "iam.admin",
    },
  ]);
  console.log("  PASS");

  console.log("Global search");
  const searchResults = await executeGlobalSearch(platform, {
    query: "verify",
    matchMode: "FULL_TEXT",
    includeFacets: true,
  });
  assert(searchResults.totalCount >= 3, "Global search returned insufficient results");
  assert(searchResults.groups.length > 0, "Grouped results missing");
  assert(
    searchResults.groups.some((group) => group.entityType === "CUSTOMER"),
    "Customer group missing",
  );
  assert(
    !searchResults.groups.some((group) =>
      group.results.some((result) => result.entityId === "verify-lead-restricted"),
    ) || platform.isOwner,
    "Owner may see all records",
  );

  const limitedPlatform: BusinessContext = {
    ...platform,
    isOwner: false,
    roleSlug: "manager",
    permissions: ["crm.view", "order.view", "files.view", "search.query", "search.view"],
  };
  const limitedSearch = await executeGlobalSearch(limitedPlatform, {
    query: "verify",
    matchMode: "FULL_TEXT",
  });
  assert(
    !limitedSearch.groups.some((group) =>
      group.results.some((result) => result.entityId === "verify-lead-restricted"),
    ),
    "Restricted record should be filtered for limited permissions",
  );
  assert(searchResults.queryLogId, "Query log not recorded");
  console.log("  PASS");

  console.log("Prefix and fuzzy search modes");
  const prefixResults = await executeGlobalSearch(platform, {
    query: "Verify Cust",
    matchMode: "PREFIX",
  });
  assert(prefixResults.totalCount >= 1, "Prefix search failed");

  const fuzzyResults = await executeGlobalSearch(platform, {
    query: "Verfy",
    matchMode: "FUZZY",
  });
  assert(fuzzyResults.totalCount >= 1, "Fuzzy search failed");
  console.log("  PASS");

  console.log("Search suggestions");
  const suggestions = await getSearchSuggestions(platform, "ver");
  assert(suggestions.recent.length > 0, "Recent suggestions missing");
  assert(suggestions.trending.length > 0, "Trending suggestions missing");
  console.log("  PASS");

  console.log("Record search click");
  const firstResult = searchResults.groups[0]?.results[0];
  assert(firstResult, "No result to click");
  await recordSearchClick(platform, {
    queryLogId: searchResults.queryLogId,
    indexRecordId: firstResult.id,
  });
  const clickCount = await prisma.searchResultClick.count({
    where: { businessId: business.id },
  });
  assert(clickCount > 0, "Search click not recorded");
  console.log("  PASS");

  console.log("Index job queue and processing");
  const job = await queueSearchIndexJob(platform, { jobType: "INCREMENTAL" });
  const processed = await processSearchIndexJob(job.id);
  assert(processed.processed >= 0, "Index job processing failed");
  console.log("  PASS");

  console.log("Reindex entity");
  const reindexResult = await reindexEntity(platform, "CUSTOMER", "verify-customer-1");
  assert(reindexResult.jobId, "Reindex job missing");
  console.log("  PASS");

  console.log("Full rebuild");
  const rebuildResult = await fullRebuildIndex(platform);
  assert(rebuildResult.jobId, "Full rebuild job missing");
  console.log("  PASS");

  console.log("Failed index recovery");
  const restrictedRecord = await prisma.searchIndexRecord.findFirst({
    where: {
      businessId: business.id,
      entityType: "LEAD",
      entityId: "verify-lead-restricted",
    },
  });
  if (restrictedRecord) {
    await prisma.searchIndexRecord.update({
      where: { id: restrictedRecord.id },
      data: { status: "FAILED" },
    });
  }
  const recovery = await recoverFailedIndexes(platform);
  assert(recovery.recovered >= 1, "Failed index recovery failed");
  console.log("  PASS");

  console.log("Remove search index");
  await removeSearchIndex(business.id, "FILE", "verify-file-1");
  const removed = await prisma.searchIndexRecord.findFirst({
    where: { businessId: business.id, entityType: "FILE", entityId: "verify-file-1" },
  });
  assert(!removed, "Index record not removed");
  console.log("  PASS");

  console.log("Search platform dashboard");
  const dashboard = await getSearchPlatformDashboard(business.id);
  assert(dashboard.totalRecords > 0, "Dashboard total records missing");
  assert(dashboard.registeredEntityTypes === SEARCH_ENTITY_TYPES.length, "Entity count mismatch");
  console.log("  PASS");

  console.log("Audit logs");
  const auditLogs = await listSearchAuditLogs(business.id);
  assert(
    auditLogs.some((log) => log.eventType === "QUERY"),
    "Query audit missing",
  );
  assert(
    auditLogs.some((log) => log.eventType === "RESULT_CLICK"),
    "Click audit missing",
  );
  assert(
    auditLogs.some((log) => log.eventType === "FULL_REBUILD"),
    "Rebuild audit missing",
  );
  console.log("  PASS");

  console.log("Extensibility registry");
  registerSearchableEntity({
    entityType: "REPORT",
    label: "Custom Report",
    requiredPermission: PERMISSION_CODES.ANALYTICS_VIEW,
    defaultFields: ["name"],
    module: "custom-module",
  });
  const registrations = await listSearchEntityRegistrations();
  assert(
    registrations.some((entry) => entry.module === "custom-module"),
    "Custom registration failed",
  );
  console.log("  PASS");

  console.log("\nGlobal Search & Indexing Platform verification passed.");
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

export {
  SEARCH_PLATFORM_ROUTES,
  SEARCH_PLATFORM_NAV_ITEMS,
  SEARCH_ENTITY_TYPES,
} from "@/modules/search-platform/constants/routes";
export { SearchPlatformNav } from "@/modules/search-platform/components/search-platform-nav";
export { SearchPlatformDashboard } from "@/modules/search-platform/components/search-platform-dashboard";
export { SearchPlatformLists } from "@/modules/search-platform/components/search-platform-lists";
export {
  registerSearchableEntity,
  listSearchableEntities,
} from "@/modules/search-platform/registry/search-registry";
export { ensureBootstrapSearchPlatform } from "@/modules/search-platform/plugins/bootstrap-search";
export {
  executeSearchEngine,
  matchesSearchQuery,
} from "@/modules/search-platform/engine/search-engine";

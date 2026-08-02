export { DocumentPlatformNav } from "@/modules/document-platform-management/components/document-platform-nav";
export { DocumentDashboardPanel } from "@/modules/document-platform-management/components/document-dashboard-panel";
export { DocumentLibraryPanel } from "@/modules/document-platform-management/components/document-library-panel";
export { DocumentFoldersPanel } from "@/modules/document-platform-management/components/document-folders-panel";
export { DocumentTemplatesPanel } from "@/modules/document-platform-management/components/document-templates-panel";
export { DocumentViewerPanel } from "@/modules/document-platform-management/components/document-viewer-panel";
export { DocumentVersionsPanel } from "@/modules/document-platform-management/components/document-versions-panel";
export { DocumentSearchPanel } from "@/modules/document-platform-management/components/document-search-panel";
export {
  getDocumentPlatformContext,
  requireDocumentPlatformActionContext,
  getDocumentDashboardContext,
  getDocumentLibraryContext,
  getDocumentFoldersContext,
  getDocumentTemplatesContext,
  getDocumentDetailContext,
  getDocumentVersionsContext,
  getDocumentSearchContext,
} from "@/modules/document-platform-management/lib/get-document-platform-context";
export {
  createDocumentAction,
  updateDocumentAction,
  archiveDocumentAction,
  restoreDocumentAction,
  deleteDocumentAction,
  duplicateDocumentAction,
  exportDocumentAction,
  createDocumentFolderAction,
  deleteDocumentFolderAction,
  createDocumentTemplateAction,
  deleteDocumentTemplateAction,
} from "@/modules/document-platform-management/actions/document-platform-actions";
export { DOCUMENT_PLATFORM_ROUTES } from "@/modules/document-platform-management/constants/routes";

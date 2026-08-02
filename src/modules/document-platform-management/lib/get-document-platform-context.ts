import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { ROUTES } from "@/constants/routes";
import { resolveAuthorizationContext } from "@/modules/authorization/services/authorization.service";
import { permissionDenied } from "@/modules/authorization/utils/authorization-errors";
import { requireApplicationAccess } from "@/modules/application-shell/lib/require-application-access";
import { DOCUMENT_PLATFORM_ROUTES } from "@/modules/document-platform-management/constants/routes";
import {
  serializeDocument,
  serializeDocumentFolder,
  serializeDocumentPreview,
  serializeDocumentSummary,
  serializeDocumentTemplate,
  serializeDocumentVersion,
} from "@/modules/document-platform-management/lib/document-platform-validation";
import type { AuthorizationContext } from "@/modules/authorization/types/authorization";
import { getCurrentUser } from "@/services/auth.service";
import { getBusinessByOwnerId } from "@/services/business-profile.service";
import {
  getDocument,
  getDocumentDashboardSummary,
  getRecentDocuments,
  listDocuments,
} from "@/services/document.service";
import { listDocumentFolders } from "@/services/document-folder.service";
import { listDocumentTemplates } from "@/services/document-template.service";
import { listDocumentVersions } from "@/services/document-version-manager.service";
import { previewDocument } from "@/services/document-preview.service";
import { searchDocuments, searchDocumentTemplates } from "@/services/document-search.service";
import { resolveDocumentPlatformPermissions } from "@/services/document-platform-permission.service";
import type { AuthUser } from "@/types/auth";
import type { BusinessProfileData } from "@/types/business-profile";

export interface DocumentPlatformContext {
  user: AuthUser;
  business: BusinessProfileData & { id: string };
  authorization: AuthorizationContext;
  permissionsFlags: ReturnType<typeof resolveDocumentPlatformPermissions>;
}

async function resolveDocumentBusiness(user: AuthUser) {
  const business = await getBusinessByOwnerId(user.id);
  if (!business?.id) throw permissionDenied();
  const authorization = await resolveAuthorizationContext(user, business);
  return { business, authorization };
}

export const getDocumentPlatformContext = cache(async (): Promise<DocumentPlatformContext> => {
  const user = await requireApplicationAccess();
  const loaded = await resolveDocumentBusiness(user);
  const permissionsFlags = resolveDocumentPlatformPermissions(
    loaded.authorization.permissions,
    loaded.authorization.isOwner,
  );

  if (!permissionsFlags.canView) redirect(ROUTES.application);

  return {
    user,
    business: loaded.business,
    authorization: loaded.authorization,
    permissionsFlags,
  };
});

export async function requireDocumentPlatformActionContext(
  permission: string,
): Promise<DocumentPlatformContext> {
  const user = await getCurrentUser();
  if (!user) throw permissionDenied();

  const loaded = await resolveDocumentBusiness(user);
  const permissionsFlags = resolveDocumentPlatformPermissions(
    loaded.authorization.permissions,
    loaded.authorization.isOwner,
  );

  const allowed = loaded.authorization.isOwner || loaded.authorization.permissions.has(permission);
  if (!allowed) throw permissionDenied();

  return {
    user,
    business: loaded.business,
    authorization: loaded.authorization,
    permissionsFlags,
  };
}

export const getDocumentDashboardContext = cache(async () => {
  const context = await getDocumentPlatformContext();
  const [summary, recent] = await Promise.all([
    getDocumentDashboardSummary(context.user.id),
    getRecentDocuments(context.user.id),
  ]);
  return {
    ...context,
    summary: serializeDocumentSummary(summary),
    recentDocuments: recent.map(serializeDocument),
  };
});

export const getDocumentLibraryContext = cache(async () => {
  const context = await getDocumentPlatformContext();
  const documents = await listDocuments(context.user.id);
  return { ...context, documents: documents.map(serializeDocument) };
});

export const getDocumentFoldersContext = cache(async () => {
  const context = await getDocumentPlatformContext();
  const folders = await listDocumentFolders(context.user.id);
  return { ...context, folders: folders.map(serializeDocumentFolder) };
});

export const getDocumentTemplatesContext = cache(async () => {
  const context = await getDocumentPlatformContext();
  const templates = await listDocumentTemplates(context.user.id);
  return { ...context, templates: templates.map(serializeDocumentTemplate) };
});

export const getDocumentDetailContext = cache(async (documentId: string) => {
  const context = await getDocumentPlatformContext();
  const document = await getDocument(context.user.id, documentId);
  if (!document) redirect(DOCUMENT_PLATFORM_ROUTES.library());

  const preview = await previewDocument(context.user.id, documentId);
  return {
    ...context,
    document: serializeDocument(document),
    preview: preview ? serializeDocumentPreview(preview) : null,
  };
});

export const getDocumentVersionsContext = cache(async (documentId: string) => {
  const context = await getDocumentPlatformContext();
  const document = await getDocument(context.user.id, documentId);
  if (!document) redirect(DOCUMENT_PLATFORM_ROUTES.library());

  const versions = await listDocumentVersions(context.user.id, documentId);
  return {
    ...context,
    document: serializeDocument(document),
    versions: versions.map(serializeDocumentVersion),
  };
});

export const getDocumentSearchContext = cache(async (query?: string) => {
  const context = await getDocumentPlatformContext();
  const trimmed = query?.trim() ?? "";
  if (!trimmed) {
    return { ...context, search: "", results: { documents: [], templates: [] } };
  }

  const [documents, templates] = await Promise.all([
    searchDocuments(context.user.id, trimmed),
    searchDocumentTemplates(context.user.id, trimmed),
  ]);

  return {
    ...context,
    search: trimmed,
    results: {
      documents: documents.map(serializeDocument),
      templates: templates.map(serializeDocumentTemplate),
    },
  };
});

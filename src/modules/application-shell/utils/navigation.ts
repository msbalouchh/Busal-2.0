import type { WorkspaceNavItem } from "@/modules/application-shell/types/workspace-shell.types";

export function normalizePath(path: string): string {
  if (path.length > 1 && path.endsWith("/")) {
    return path.slice(0, -1);
  }

  return path;
}

export function isWorkspacePathActive(pathname: string, href: string): boolean {
  const current = normalizePath(pathname);
  const target = normalizePath(href);

  if (target === "/dashboard") {
    return current === target;
  }

  return current === target || current.startsWith(`${target}/`);
}

export function isWorkspaceNavItemActive(pathname: string, item: WorkspaceNavItem): boolean {
  if (item.href && isWorkspacePathActive(pathname, item.href)) {
    return true;
  }

  return item.children?.some((child) => isWorkspaceNavItemActive(pathname, child)) ?? false;
}

export function flattenWorkspaceNavItems(items: WorkspaceNavItem[]): WorkspaceNavItem[] {
  const flattened: WorkspaceNavItem[] = [];

  for (const item of items) {
    flattened.push(item);

    if (item.children?.length) {
      flattened.push(...flattenWorkspaceNavItems(item.children));
    }
  }

  return flattened;
}

export function resolveActiveWorkspaceNavLabel(
  pathname: string,
  sections: { items: WorkspaceNavItem[] }[],
): string {
  let bestMatch: WorkspaceNavItem | null = null;
  let bestMatchLength = 0;

  for (const section of sections) {
    for (const item of flattenWorkspaceNavItems(section.items)) {
      if (!item.href || !isWorkspacePathActive(pathname, item.href)) {
        continue;
      }

      const hrefLength = normalizePath(item.href).length;

      if (hrefLength >= bestMatchLength) {
        bestMatch = item;
        bestMatchLength = hrefLength;
      }
    }
  }

  return bestMatch?.label ?? "Busal OS";
}

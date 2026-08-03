/** Performs a full navigation to an in-app path on the current origin. */
export function assignAppPath(path: string): void {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  window.location.assign(normalizedPath);
}

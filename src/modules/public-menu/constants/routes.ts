export const PUBLIC_MENU_ROUTES = {
  menu: (slug: string) => `/menu/${slug}`,
} as const;

export const PUBLIC_MENU_INVALID_MESSAGE = "This QR code is invalid or no longer active." as const;

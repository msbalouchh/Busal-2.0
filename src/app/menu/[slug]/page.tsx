import type { Metadata } from "next";

import { PublicMenuErrorPage } from "@/modules/public-menu/components/public-menu-error-page";
import { PublicMenuWithCart } from "@/modules/public-menu/components/public-menu-with-cart";
import { getBusinessDisplayName } from "@/modules/public-menu/lib/public-menu-utils";
import { loadPublicMenuPage } from "@/modules/public-menu/lib/load-public-menu-page";
import { resolvePublicQRMenu } from "@/services/qr-menu.service";

interface PublicMenuPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PublicMenuPageProps): Promise<Metadata> {
  const { slug } = await params;
  const resolved = await resolvePublicQRMenu(slug);

  if (!resolved.ok) {
    return { title: "Menu unavailable" };
  }

  return {
    title: getBusinessDisplayName(resolved.data.business),
  };
}

export default async function PublicMenuPage({ params }: PublicMenuPageProps) {
  const { slug } = await params;

  let result;

  try {
    result = await loadPublicMenuPage(slug);
  } catch {
    return <PublicMenuErrorPage />;
  }

  if (!result.ok) {
    return <PublicMenuErrorPage />;
  }

  return <PublicMenuWithCart slug={slug} menu={result.menu} initialCart={result.initialCart} />;
}

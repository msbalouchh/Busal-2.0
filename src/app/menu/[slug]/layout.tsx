import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Menu",
};

export default function PublicMenuLayout({ children }: { children: React.ReactNode }) {
  return children;
}

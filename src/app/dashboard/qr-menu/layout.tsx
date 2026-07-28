import type { ReactNode } from "react";

interface QRMenuLayoutProps {
  children: ReactNode;
}

export default function QRMenuLayout({ children }: QRMenuLayoutProps) {
  return <div className="flex flex-1 flex-col gap-6 p-6">{children}</div>;
}

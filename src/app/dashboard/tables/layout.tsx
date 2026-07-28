import type { ReactNode } from "react";

interface TablesLayoutProps {
  children: ReactNode;
}

export default function TablesLayout({ children }: TablesLayoutProps) {
  return <div className="flex flex-1 flex-col gap-6 p-6">{children}</div>;
}

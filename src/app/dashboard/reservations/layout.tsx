import type { ReactNode } from "react";

interface ReservationsLayoutProps {
  children: ReactNode;
}

export default function ReservationsLayout({ children }: ReservationsLayoutProps) {
  return <div className="flex flex-1 flex-col gap-6 p-6">{children}</div>;
}

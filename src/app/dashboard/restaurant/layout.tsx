import type { ReactNode } from "react";

import { RestaurantNav } from "@/modules/restaurant-operations/components/restaurant-nav";

interface RestaurantLayoutProps {
  children: ReactNode;
}

export default function RestaurantLayout({ children }: RestaurantLayoutProps) {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <RestaurantNav />
      {children}
    </div>
  );
}

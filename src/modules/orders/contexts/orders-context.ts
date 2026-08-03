import { createContext } from "react";

import type { OrdersContextValue } from "@/modules/orders/types/order";

export const OrdersContext = createContext<OrdersContextValue | null>(null);
